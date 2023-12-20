import Debug from 'debug';

import React, {
	useContext,
	useEffect,
	useState
} from 'react';

import {
	Autocomplete,
	Box,
	Dialog,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	InputAdornment,
	TextField,
	Tooltip
} from '@mui/material';

import {
	DeleteForever as DeleteForeverIcon,
	Download as DownloadIcon,
	Edit as EditIcon,
	HelpOutline as HelpOutlineIcon,
	IosShare as IosShareIcon
} from '@mui/icons-material';

import { AppContext } from './AppContext';
import { refetch } from './utils';
import {
	addAIConsiderations
} from './api';

export default function (props) {
	const {
		selectedDSquare
	} = props;

	const {
		considerations,
		setConsiderations,
		decision,
		setDecision,
		session,
		setSession
	} = useContext(AppContext);

	const [ decisionChanged, setDecisionChanged ] = useState(false);
	const [ openShare, setOpenShare ] = useState(false);
	const [ accountsError, setAccountsError ] = useState(false);

	const debug = Debug('descartes-squares:DSTab:'+session.account.email);

	useEffect(() => {
		setDecision(selectedDSquare.decision);
	}, [selectedDSquare.decision]);


	const handleDecisionChange = (event) => {
		// debug('handleDecisionChange', event.target.value);
		setDecision(event.target.value);
		selectedDSquare.decision = event.target.value;
		setDecisionChanged(true);
	};

	const updateDecision = async () => {
		if(!decisionChanged) {
			return;
		}

		debug('updateDecision', decision);
		const body = JSON.stringify({
			decision
		});
	
		const fetchOptions = {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-type': 'application/json'
			},
			body
		};
		
		return refetch(`/api/squares/${selectedDSquare.id}/decision`, fetchOptions)
		.then(response => response.json())
		.then(decision => {
			debug('updateDecision', decision);
			setDecisionChanged(false);
		}); 
				
	};

	const handleDecisionBlur = (event) => {
		// debug('handleDecisionBlur');
		updateDecision();
	};

	const handleDecisionKeyDown = async (event) => {
		// debug('handleDecisionKeyDown');
		if (event.key != 'Enter') {
			return;
		}
		if(!considerations) {
			return;
		}
		if(considerations.length) {
			return;
		}
		await updateDecision();
		addAIConsiderations({
			selectedDSquare,
			considerations,
			setConsiderations,
		});
	};

	const handleAIAssist = (event) => {
		debug('handleAIAssist');
		addAIConsiderations({
			selectedDSquare,
			considerations,
			setConsiderations,
		});
	};

	const handleShareSquare = (event) => {
		debug('handleShareSquare');
		setOpenShare(true);
	};

	const placeholders = [
		'get a cat?',
		'buy a car?',
		'look for a new job?'
	];
	const getRandomPlaceHolder = () => {
		const i = Math.floor(Math.random() * (placeholders.length - 1));
		return placeholders[i];
	};

	const handleDeleteSquare = async (event) => {
		debug('deleteDSquare >', selectedDSquare.id);
		return refetch(`/api/squares/${selectedDSquare.id}`, { method: 'DELETE', credentials: 'include' })
		.then(response => response.json())
		.then(square => {
			debug('deleteDSquare <', square);
			let nextDSquare = {};
			const positions = {};
			props.dSquares.forEach((dSquare, i) => positions[dSquare.id] = i);
			const position = positions[selectedDSquare.id];
			if(null != position) {
				nextDSquare = props.dSquares[position + 1] || props.dSquares[position - 1];
			}
			if(nextDSquare) {
				props.setSelectedDSquare(nextDSquare);
			}
			props.setDSquares(props.dSquares.filter( _square => _square.id != selectedDSquare.id ));
			return square;
		});
	};

	const handleCloseShare = async (event) => {
		setOpenShare(false);
	};

	const handleAccountsChange = async (event, options, reason, detail) => {
		debug('handleAccountsChange', detail.option);
	};

	const accountsElements = selectedDSquare.accounts?.map((account, i) => {
                        const label = <Box key={i} account={account}>
                            {account}
                        </Box>;
                        return label;
                    });
    
	const aiAssist = considerations && considerations.length == 0 && <Tooltip placement="top-start" title="AI Assist">
						<HelpOutlineIcon onClick={handleAIAssist} />
					</Tooltip>;

	return <Box sx={{ mt: '8px', flexGrow: 1 }} >
			<Dialog open={openShare} onClose={handleCloseShare}>
				<DialogTitle>Sharing as {session.account.email}</DialogTitle>
				<DialogContent>
					<Autocomplete
						clearIcon={false}
						options={[]}
						multiple
						freeSolo
						value={ accountsElements }
						renderInput={params => <TextField label='Emails' {...params} error={accountsError} helperText='Entries must be in email format: username@hostname.' />}
						onChange={ handleAccountsChange }
					/>
				</DialogContent>
			</Dialog>
			<TextField
				disabled={ considerations==null || considerations.length > 0 }
				label='Should I ...'
				size='small'
				fullWidth={true}
				inputProps={{ style: { textAlign: 'center' } }}
				value={decision}
				placeholder={getRandomPlaceHolder()}
				onChange={handleDecisionChange}
				onBlur={handleDecisionBlur}
				onKeyDown={handleDecisionKeyDown}
				InputProps={{
					endAdornment: (
						<InputAdornment position="end">
							{aiAssist}
							<Tooltip placement="top-start" title="Share this sqaure">
								<IosShareIcon onClick={handleShareSquare} />
							</Tooltip>
							<Tooltip placement="top-start" title="Delete this square">
								<DeleteForeverIcon onClick={handleDeleteSquare} />
							</Tooltip>
						</InputAdornment>
					)
				}}
			/>
	</Box>;
}

