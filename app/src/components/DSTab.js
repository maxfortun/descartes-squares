import Debug from 'debug';

import React, {
	useContext,
	useEffect,
	useState
} from 'react';

import {
	Autocomplete,
	Box,
	Chip,
	Dialog,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	InputAdornment,
	TextField,
	Tooltip,
	Typography
} from '@mui/material';

import {
	Close as CloseIcon,
	DeleteForever as DeleteForeverIcon,
	Download as DownloadIcon,
	Edit as EditIcon,
	HelpOutline as HelpOutlineIcon,
	IosShare as IosShareIcon
} from '@mui/icons-material';

import { AppContext } from './AppContext';
import { refetch } from './utils';
import {
	addAIConsiderations,
	updateDecision,
	inviteMember,
	removeMember
} from './api';

export default function (props) {
	const {
		selectedSquare, setSelectedSquare,
		selectedDecision, setSelectedDecision,
		selectedConsiderations, setSelectedConsiderations,
		selectedMembers, setSelectedMembers,
		selectedInvites, setSelectedInvites,
		squares, setSquares,
		invites, setInvites,
		error, setError,
		session, setSession
	} = useContext(AppContext);

	const [ decisionChanged, setDecisionChanged ] = useState(false);
	const [ openShare, setOpenShare ] = useState(false);
	const [ selectedMembersError, setSelectedMembersError ] = useState(false);
	const [ selectedMembersHelperText, setSelectedMembersHelperText ] = useState(false);

	const debug = Debug('dsquares:DSTab:'+session.account.email);

	useEffect(() => {
		setSelectedDecision(selectedSquare.decision);
	}, [selectedSquare.decision]);


	const handleDecisionChange = (event) => {
		// debug('handleDecisionChange', event.target.value);
		setSelectedDecision(event.target.value);
		selectedSquare.decision = event.target.value;
		setDecisionChanged(true);
	};

	const handleDecisionBlur = (event) => {
		// debug('handleDecisionBlur');
		updateDecision({
			selectedSquare,
			decisionChanged,
			setDecisionChanged
		});
	};

	const handleDecisionKeyDown = async (event) => {
		// debug('handleDecisionKeyDown');
		if (event.key != 'Enter') {
			return;
		}
		if(!selectedConsiderations) {
			return;
		}
		if(selectedConsiderations.length) {
			return;
		}
		await updateDecision({
			selectedSquare,
			decisionChanged,
			setDecisionChanged
		});
		addAIConsiderations({
			selectedSquare,
			selectedConsiderations,
			setSelectedConsiderations,
		});
	};

	const handleAIAssist = (event) => {
		debug('handleAIAssist');
		addAIConsiderations({
			selectedSquare,
			selectedConsiderations,
			setSelectedConsiderations,
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
		debug('deleteDSquare >', selectedSquare.id);
		return refetch(`/api/squares/${selectedSquare.id}`, { method: 'DELETE', credentials: 'include' })
		.then(response => response.json())
		.then(square => {
			debug('deleteDSquare <', square);
			let nextDSquare = {};
			const positions = {};
			props.squares.forEach((dSquare, i) => positions[dSquare.id] = i);
			const position = positions[selectedSquare.id];
			if(null != position) {
				nextDSquare = props.squares[position + 1] || props.squares[position - 1];
			}
			if(nextDSquare) {
				props.setSelectedSquare(nextDSquare);
			}
			setSquares(prev => prev.filter( _square => _square.id != selectedSquare.id ));
			return square;
		});
	};

	const handleCloseShare = async (event) => {
		setOpenShare(false);
	};

	const validEmail = (email) => {
		if(!email) {
			return true;
		}
		return email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
	};

	const handleMembersTextKeyDown = async (event) => {
		if(!validEmail(event.target.value)) {
			setSelectedMembersHelperText('Format: username@hostname.tld');
			if(event.key === 'Enter') {
				event.stopPropagation();
				setSelectedMembersError(true);
			}
			return;
		}
		
		if(selectedMembers?.map(member => member.id).includes(event.target.value)) {
			setSelectedMembersHelperText('Member already has access');
			if(event.key === 'Enter') {
				event.stopPropagation();
				setSelectedMembersError(true);
			}
			return;
		}

		setSelectedMembersError(false);
	};

	const handleMembersChange = async (event, options, reason, detail) => {
		debug('handleMembersChange', reason, detail.option);

		if(reason == 'createOption') {
			if(!validEmail(detail.option)) {
				setSelectedMembersError(true);
				return;
			}

			setSelectedMembersError(false);
			setSelectedMembersHelperText(null);
			await inviteMember({
				selectedSquare,
				email: detail.option,
				setSelectedInvites
			});
			return;
		}

		if(reason == 'removeOption') {
			await removeMember({
				selectedSquare,
				email: detail.option,
				setSelectedInvites,
				setSelectedMembers
			});
			return;
		}
	};

	const sharedWith = [];

	selectedMembers?.filter(member => member.email != session.account.email)
	.forEach(member => {
		sharedWith.push(Object.assign({selectedMembership: 'member'}, member));
	});

	selectedInvites?.forEach(member => {
		sharedWith.push(Object.assign({selectedMembership: 'invited'}, member));
	});
	
	const aiAssist = selectedConsiderations && selectedConsiderations.length == 0 && <Tooltip placement="top-start" title="AI Assist">
		<HelpOutlineIcon onClick={handleAIAssist} />
	</Tooltip>;

	const renderTagMember = (option, getTagProps, i) => {
		return <Chip {...getTagProps({ index: i })} sx={{ backgroundColor: 'lightgreen' }} title={option.email} label={option.name || option.email} />;
	};

	const renderTagInvited = (option, getTagProps, i) => {
		return <Chip {...getTagProps({ index: i })} sx={{ backgroundColor: 'lightyellow' }} title={option.invited} label={option.invited} />;
	};

	const renderTag = (option, getTagProps, i) => {
		if( option.selectedMembership == 'invited' ) {
			return renderTagInvited(option, getTagProps, i);
		}

		return renderTagMember(option, getTagProps, i)
	};

	return <Box sx={{ mt: '8px', flexGrow: 1 }} >
			<Dialog fullWidth open={openShare} onClose={handleCloseShare}>
				<DialogTitle sx={{ m: 0, p: 2 }}>
						Sharing as {session.account.name || session.account.email}
				</DialogTitle>
				<IconButton
					aria-label="close"
					onClick={handleCloseShare}
					sx={{
						position: 'absolute',
						right: 8,
						top: 8,
						color: (theme) => theme.palette.grey[500],
					}}
				>
					<CloseIcon />
				</IconButton>
				<DialogContent>
					<Autocomplete
						clearIcon={false}
						options={[]}
						multiple
						freeSolo
						value={ sharedWith }
						renderInput={params =>
							<TextField 
								sx={{ mt: '16px' }} 
								label='With ...' 
								{...params} 
								onKeyDown={handleMembersTextKeyDown}
								error={selectedMembersError} 
								helperText={selectedMembersHelperText}
								placeholder='Enter an email address and press enter.'
							/>
						}
						renderTags={(values, getTagProps, ownerState) => {
							return values.map((option, i) => renderTag(option, getTagProps, i));
						}}
						onChange={ handleMembersChange }
					/>
				</DialogContent>
			</Dialog>
			<Tooltip placement="top-start" title={selectedDecision}>
				<TextField
					disabled={ selectedConsiderations==null || selectedConsiderations.length > 0 }
					label='Should I ...'
					size='small'
					fullWidth={true}
					inputProps={{ style: { textAlign: 'center' } }}
					value={selectedDecision}
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
			</Tooltip>
	</Box>;
}

