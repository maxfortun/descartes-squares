const debug = require('debug')('dsquares:lib:dsquares');

const crypto = require('crypto');

const { atob, btoa } = require('./utils');

async function account(req, res, next) {
	const { options } = req.app.settings;
	let signature = null;
	try {
		const [ head, payload, sig ] = req.oidc.access_token.split('.');
		const decoded_head = JSON.parse(atob(head));
		// debug('decoded_head.typ', decoded_head.typ);
		if(decoded_head.typ == 'JWT') {
			req.oidc.decoded_access_token = JSON.parse(atob(payload));
			signature = sig;
		} else {
			signature = req.oidc.access_token;
		}
	} catch(e) {
		// debug(req.id, "Could not decode access token", req.oidc.access_token, e);
		signature = req.oidc.access_token;
	}

	try {
		req.oidc.decoded_id_token = JSON.parse(atob(req.oidc.id_token.split('.')[1]));
	} catch(e) {
		debug(req.id, "Could not decode id token", req.oidc.id_token);
	}

	try {
		req.oidc.decoded_user_info = JSON.parse(atob(req.oidc.user_info));
	} catch(e) {
		debug(req.id, "Could not decode user info", req.oidc.user_info);
	}

	// debug(req.id, "getOrCreate", req.oidc);
	const email = getClaim(req.oidc, 'email');

	req.account = await options.accounts[email];
	debug(req.id, "account", email, req.account);

	if(req.account) {
		return next();
	}

	req.account = Object.assign({}, {
		email,
		name:			getClaim(req.oidc, 'name'),
		given_name:		getClaim(req.oidc, 'given_name'),
		family_name:	getClaim(req.oidc, 'family_name'),
		picture:		getClaim(req.oidc, 'picture')
	});

	debug(req.id, 'account', req.account);
	options.accounts[email] = req.account;
	await options.accounts[email];

	return next();
}

function getClaim(oidc, key) {
	const types = [ "decoded_user_info", "decoded_id_token", "decoded_access_token" ];
	for(let i = 0; i < types.length; i++) {
		let type = types[i];
		try {
			const value = oidc[type][key];
			if(value) {
				return value;
			}
		} catch(e) {}
	}
	return null;
}
	
async function listSquares(req) {
	const { options } = req.app.settings;
	const mongoose = await options.dsquaresMongoose();

	const dsquares = [];
	const dsquaresCursor = await mongoose.connection.collection('dsquares').aggregate([
		{ $match: { members: req.account.email }},
		{ $lookup: {
			from: 'accounts',
			localField: 'members',
			foreignField: 'id',
			as: 'members'
		}},
		{ $lookup: {
			from: 'invites',
			localField: 'id',
			foreignField: 'square_id',
			as: 'invites'
		}},
		{ $lookup: {
			from: 'accounts',
			localField: 'invites.invited',
			foreignField: 'id',
			as: 'invited'
		}},
		{ $project: {
			'_id': 0,
			considerations: 0,
			'members._id': 0,
			'invites._id': 0,
			'invited._id': 0
		}} 
	]);

	for await (const dsquare of dsquaresCursor) {
		dsquares.push(dsquare);	
	}

	debug(req.id, "listSquares", dsquares);

	return dsquares;
}

async function listInvites(req) {
	const { options } = req.app.settings;
	const mongoose = await options.dsquaresMongoose();

	const dsquares = [];
	const dsquaresCursor = await mongoose.connection.collection('invites').aggregate([
		{ $match : { invited: req.account.email } },
		{ $lookup: {
			from: 'dsquares',
			localField: 'square_id',
			foreignField: 'id',
			as: 'dsquare'
		}},
		{ $project: {
			_id: 0,
			'dsquare.considerations': 0,
			'invites._id' : 0
		}} 
	]);

	for await (const dsquare of dsquaresCursor) {
		delete dsquare.dsquare[0]._id;
		dsquares.push(dsquare.dsquare[0]);	
	}

	debug(req.id, "listInvites", dsquares);

	return dsquares;
}

async function findSquare(req) {
	const { options } = req.app.settings;
	const mongoose = await options.dsquaresMongoose();
	
	debug(req.id, "findSquare", req.params.square);

	const dsquaresCursor = await mongoose.connection.collection('dsquares').aggregate([
		{ $match: {
			id: req.params.square
		}},
		{ $lookup: {
			from: 'accounts',
			localField: 'members',
			foreignField: 'id',
			as: 'members'
		}},
		{ $lookup: {
			from: 'invites',
			localField: 'id',
			foreignField: 'square_id',
			as: 'invites'
		}},
		{ $lookup: {
			from: 'accounts',
			localField: 'invites.invited',
			foreignField: 'id',
			as: 'invited'
		}},
		{ $project: {
			'members._id' : 0,
			'invites._id' : 0,
			'invited._id' : 0
		}} 
	]);

	for await (const dsquare of dsquaresCursor) {
		delete dsquare._id;
		return dsquare;	
	}

	return {};
}

async function canCreateSquare(req, res, next) {
	next();
}

async function createSquare(req) {
	const { options } = req.app.settings;
	
	const dsquare = {
		id: crypto.randomUUID(),
		members: [ req.account.email ],
		decision: '',
		considerations: []
	};

	debug(req.id, "createSquare", dsquare);

	options.dsquares[dsquare.id] = dsquare;
	const square = await options.dsquares[dsquare.id];
	delete square._id;
	return square;
}

async function deleteSquare(req) {
	const { options } = req.app.settings;
	
	delete options.dsquares[req.params.square];
	return await options.dsquares[req.params.square];
}

async function updateDecision(req) {
	const { options } = req.app.settings;

	debug(req.id, 'updateDecision', req.body.decision);

	const mongoose = await options.dsquaresMongoose();

	const result = await mongoose.connection.collection('dsquares').findOneAndUpdate(
																{ id: req.params.square },
																{ $set: { decision: req.body.decision } }
	);
	
	debug(req.id, 'updateDecision result', result);

	return { decision: req.body.decision };
}


async function createConsideration(req) {
	const { options } = req.app.settings;

	const consideration = { 
		id: crypto.randomUUID(),
		account: req.account.email,
		cause: req.body.cause,
		effect: req.body.effect,
		desc: req.body.desc
	};

	debug(req.id, 'createConsideration', consideration);

	const mongoose = await options.dsquaresMongoose();

	const result = await mongoose.connection.collection('dsquares').findOneAndUpdate(
									{ id: req.params.square },
									{ $push: { considerations: consideration }}
					);
	debug(req.id, 'createConsideration result', result);
	
	return consideration;
}

async function updateConsideration(req) {
	const { options } = req.app.settings;

	const consideration = { 
		id: req.body.id,
		account: req.account.email,
		cause: req.body.cause,
		effect: req.body.effect,
		desc: req.body.body
	};

	debug(req.id, 'updateConsideration', consideration);

	const mongoose = await options.dsquaresMongoose();

	const result = await mongoose.connection.collection('dsquares').findOneAndUpdate(
																{ id: req.params.square },
																{ $set: { 'considerations.$[i]': consideration } },
																{ arrayFilters: [ { 'i.id': req.params.consideration } ] }
	);
	
	debug(req.id, 'updateConsideration result', result);

	return consideration;
}

async function deleteConsideration(req) {
	const { options } = req.app.settings;

	debug(req.id, 'deleteConsideration', req.params);

	const mongoose = await options.dsquaresMongoose();

	const result = await mongoose.connection.collection('dsquares').findOneAndUpdate(
																{ id: req.params.square },
																{ $pull: { considerations: { id: req.params.consideration } } }
	);
	
	debug(req.id, 'deleteConsideration result', result);

	return { id: req.params.consideration };
}

async function fetchAccount(req) {
	const { options } = req.app.settings;
	
	debug(req.id, "findSquare", req.params.square);

	const account = await options.accounts[req.account.email];
	if(!account) {
		return {};
	}
	delete account._id;
	return account;
}

async function appInfo(req) {
	const { options } = req.app.settings;

	const account = await fetchAccount(req);

	const mongoose = await options.dsquaresMongoose();

	const appInfo = {
		squares: (await listSquares(req)).map( dsquare => dsquare.id ),
		invites: (await listInvites(req)).map( invite => invite.id ),
		limits: {
			squares: account.limits?.squares || 3
		}
	};

	debug(req.id, "appInfo", appInfo);

	return appInfo;
}

async function logout(req) {
	const { options } = req.app.settings;
	return {};
}

async function inviteMember(req) {
	const { options } = req.app.settings;
	const mongoose = await options.dsquaresMongoose();

	const dsquaresCursor = await mongoose.connection.collection('invites').insertOne({
		id: crypto.randomUUID(),
		account: req.account.email,
		square_id: req.params.square,
		invited: req.body.email
	});

	return { email: req.body.email };
}

async function removeMember(req) {
	const { options } = req.app.settings;
	const mongoose = await options.dsquaresMongoose();

/*
	const dsquaresCursor = await mongoose.connection.collection('invites').insertOne({
		id: crypto.randomUUID(),
		account: req.account.email,
		square_id: req.params.square,
		invited: req.body.email
	});
*/
	return { email: req.body.email };
}

module.exports = {
	account,
	listSquares,
	listInvites,
	findSquare,
	createSquare,
	deleteSquare,
	updateDecision,
	createConsideration,
	updateConsideration,
	deleteConsideration,
	appInfo,
	logout,
	inviteMember,
	removeMember
};
