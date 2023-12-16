import Debug from 'debug';

import { refetch } from './utils';

const debug = Debug('descartes-squares:api');

const fetchDSquare = async (props) => {
	const {
		selectedDSquare,
		setConsiderations
	} = props;

	debug('fetchDSquare >', selectedDSquare.id);
	return refetch(`/api/squares/${selectedDSquare.id}`, { credentials: 'include' })
	.then(response => response.json())
	.then(square => {
		debug('fetchDSquare <', square);
		localStorage.dSquareId = square.id;
		setConsiderations(square.considerations);
		return square;
	});
};

const createConsideration = async (props) => {
	const {
		cause,
		effect,
		desc,
		selectedDSquare,
		setConsiderations
	} = props;

	debug('createConsideration', cause, effect, desc);
	const body = JSON.stringify({
		cause,
		effect,
		desc
	});

	const fetchOptions = {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-type': 'application/json'
		},
		body
	};

	return refetch(`/api/squares/${selectedDSquare.id}/considerations`, fetchOptions)
	.then(response => response.json())
	.then(consideration => {
		debug('createConsideration', consideration);
		setConsiderations(prev => prev.concat([consideration]));
		return consideration;
	});
};

const addAIConsiderations = async (props) => {
	const {
		selectedDSquare,
		setConsiderations,
	} = props;

	debug('addAIConsiderations >');

	await refetch(`/api/ai/vertex/${selectedDSquare.id}`, { credentials: 'include' })
	.then(response => response.json())
	.then(async questions => {
		debug('addAIConsiderations <', questions);
		return Promise.all(questions.questions.map(async question => {
			let cause = null;
			let effect = null;
			if(question.question.match(/^What will not happen /i)) {
				effect = 'will not';
			} else {
				effect = 'will';
			}
			if(question.question.match(/ happen if I do not /i)) {
				cause = 'do not';
			} else {
				cause = 'do';
			}

			return Promise.all(question.answers.map(async answer => {
				return createConsideration({
					cause,
					effect,
					desc: answer.answer,
					selectedDSquare,
					setConsiderations
				});
			}));
		}));
	});
};

const deleteConsideration = async () => {
	const {
		selectedDSquare,
		considerationId,
		setConsiderations
	} = props;

	debug('deleteConsideration', considerationId);
	const fetchOptions = {
		method: 'DELETE',
		credentials: 'include',
		headers: {
			'Content-type': 'application/json'
		}
	};

	return refetch(`/api/squares/${selectedDSquare.id}/considerations/${considerationId}`, fetchOptions)
	.then(response => response.json())
	.then(consideration => {
		debug('deleteConsideration', consideration);
		setConsiderations(prev => prev.filter(_consideration => _consideration.id != consideration.id));
		return consideration;
	});
};

const storeConsideration = async (cause, effect) => {
	const inputRef = descsRefs[descKey(cause,effect)];

	if( ! inputRef.current ) {
		return;
	}

	if( ! inputRef.current.value ) {
		return;
	}

	const [ desc, setDesc ] = descs[descKey(cause, effect)];
	debug('storeConsideration', cause, effect, desc);

	await createConsideration(cause, effect, inputRef.current.value);

	inputRef.current.value = '';
};

module.exports = {
	fetchDSquare,
	createConsideration,
	addAIConsiderations
};