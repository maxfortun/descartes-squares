import Debug from 'debug';
import React, {
	useContext,
	useState,
	useEffect,
	useRef
} from 'react';

import {
	Box,
	IconButton,
	Tab,
	Tabs,
	Tooltip
} from '@mui/material';

import {
	Add as AddIcon,
	ArrowForwardOutlined as ArrowForwardOutlinedIcon,
	PlaylistAddCheckOutlined as PlaylistAddCheckOutlinedIcon,
	PlaylistAddOutlined as PlaylistAddOutlinedIcon
} from '@mui/icons-material';

import {
	createDSquare
} from './api';

import { AppContext } from './AppContext';
import { refetch } from './utils';
import DSTab from './DSTab';

export default function (props) {
	const {
		selectedDSquare,
		setSelectedDSquare
	} = props;

	const {
		setConsiderations,
		setDSquares,
		error,
		setError,
		session,
		setSession
	} = useContext(AppContext);

	const debug = Debug('descartes-squares:DSTabs:'+session.account.email);

	if(!props.dSquares) {
		return;
	}

	useEffect(() => {
		if(props.dSquares.length) {
			return;
		}
		createDSquare({
			setDSquares,
			setConsiderations,
			setSelectedDSquare,
			setError
		});
	}, [props.dSquares]);

	useEffect(() => {
		if(selectedDSquare.id !== undefined) {
			return;
		}

		if(localStorage.dSquareId) {
			const selectedSquare = props.dSquares.some(square => square.id == localStorage.dSquareId)[0];
			debug('useEffect', 'selectedDSquare.id localStorage.dSquareId', 'selectedSquare', props.dSquares, localStorage.dSquareId, selectedSquare);
			if(selectedSquare) {
				setSelectedDSquare(selectedSquare);
				return;
			}
		}

		if(props.dSquares.length > 0) {
			const selectedSquare = props.dSquares[0];
			debug('useEffect', 'selectedDSquare.id 0', 'selectedSquare', props.dSquares, selectedSquare);
			setSelectedDSquare(selectedSquare);
			return;
		}

	}, [selectedDSquare.id]);


	if(!selectedDSquare.id) {
		return;
	}

	const handleAdd = async (event) => {
		createDSquare({
			setDSquares,
			setConsiderations,
			setSelectedDSquare,
			setError
		});
	};

	const handleChange = (event, i) => {
		const selectedSquare = props.dSquares[i];
		debug('handleChange', i, selectedSquare);
		setConsiderations(null);
		setSelectedDSquare(selectedSquare);
	};

	const handleShowInvites = (event) => {
	};

	const handleShowOwn = (event) => {
	};

	debug("Rendering", props.dSquares);
	const tabs = props.dSquares.map((dSquare, i) => {
		if(dSquare.id && dSquare.id == selectedDSquare.id) {
			return <DSTab key={i} {...props} dSquare={dSquare} />
		}
		return <Tab key={i} label={dSquare.decision || 'Empty' } />
	}); 
	
	const value = props.dSquares.map(dSquare => dSquare.id).indexOf(selectedDSquare.id);
	debug("selectedDSquare", value, selectedDSquare);

	const buttons = [];
	buttons.push(
		<IconButton
			key={buttons.length}
			size="small"
			onClick={handleAdd}
		>
			<Tooltip placement="top-start" title="Add a square">
				<AddIcon />
			</Tooltip>
		</IconButton>
	);

	buttons.push(
		<IconButton
			key={buttons.length}
			size="small"
			onClick={handleShowInvites}
		>
			<Tooltip placement="top-start" title="Show invites">
				<PlaylistAddOutlinedIcon />
			</Tooltip>
		</IconButton>
	);
	
	return <Box
		display='flex'
		justifyContent='center'
		sx={{ mt: '16px' }}
	>
		<Box
			justifyContent='center'
			sx={{ width:'100%' }}
		>
			<Tabs
				value={value}
				onChange={handleChange}
				variant="scrollable"
  				scrollButtons={false}
			>
				{tabs}
			</Tabs>
		</Box>
		<Box 
			display='flex'
			justifyContent='center'
			sx={{ ml: '4px', mr: '4px' }}
		>
			{buttons}
		</Box>
	</Box>;
}

