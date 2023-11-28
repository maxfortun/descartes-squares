import Debug from 'debug';
import React, { useContext, useState, useEffect, useRef } from 'react';

import {
	Box,
	Chip,
	Button,
	FormControl,
	FormControlLabel,
	FormLabel,
	Icon,
	IconButton,
	Paper,
	Radio,
	RadioGroup,
	Switch,
	Table, TableContainer, TableCell, TableRow, TableHead, TableBody,
	TextField,
	Typography
} from '@mui/material';

import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { ArrowForwardOutlined as ArrowForwardOutlinedIcon } from '@mui/icons-material';
import { Add as AddIcon } from '@mui/icons-material';

import { AppContext } from './AppContext';
import Loader from './Loader';

export default function (props) {
	const { session, setSession } = useContext(AppContext);
	const [ id, setId ] = useState(props.dSquareId);

	const [ decision, setDecision ] = useState('');
	const [ decisionChanged, setDecisionChanged ] = useState(false);

	const [ considerations, setConsiderations ] = useState([]);

	const [ shouldStore, setShouldStore ] = useState(false);

	const border = '1px solid rgba(224, 224, 224, 1)';

	const debug = Debug('descartes-dSquares:DSquare:'+session.account.email);

	debug("DSquare");

	const fetchDSquare = async () => {
		debug('fetchDSquare');
		return fetch(`/api/squares/${id}`, { credentials: 'include' })
		.then(response => response.json())
		.then(square => {
			debug('fetchDSquare', square);
			setId(square.id);
			setConsiderations(square.considerations);
			return square;
		});
	};

	const createDSquare = async () => {
		debug('createDSquare');
		return fetch(`/api/squares`, { method: 'POST', credentials: 'include' })
		.then(response => response.json())
		.then(square => {
			debug('createDSquare', square);
			setId(square.id);
			setConsiderations(square.considerations);
			return square;
		});
	};

	const didMount = useRef(false);
	useEffect(() => {
		if(!didMount.current) {
			didMount.current = true;
			debug('useEffect', 'mounted');
			if(!status) {
				if(id) {
					fetchDSquare();
				} else {
					createDSquare();
				}
			}
			return;
		}
	});

	if(!id) {
		return <Loader />;
	}

	const handleDecisionChange = async (event) => {
		setDecisionChanged(true);
	};

	const handleDecisionBlur = async (event) => {
		if(!decisionChanged) {
			return;
		}
		await updateDecision();
		setDecisionChanged(false);
	};

	const deleteConsideration = async (considerationId) => {
		debug('deleteConsideration', considerationId);
	};

	const createConsideration = async (cause, effect) => {
		debug('createConsideration', cause, effect);
		const body = JSON.stringify({
			cause,
			effect
		});

		const fetchOptions = {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-type': 'application/json'
			},
			body
		};

		return fetch(`/api/squares/${id}`, fetchOptions)
		.then(response => response.json())
		.then(consideration => {
			debug('createConsideration', consideration);
			setConsiderations(considerations.concat([consideration]));
			return consideration;
		});

	};

	const renderConsiderations = (cause, effect) => {
		const considerationElements = considerations
					.filter(consideration => consideration.cause == cause && consideration.effect == effect)
					.map((consideration, i) => 
			 			<Chip key={i} label={consideration.id} variant="outlined" onDelete={() => deleteConsideration(consideration.id)} />
					);

		return <Box style={{ height: '100%', width: '100%' }}>
			<Box style={{ display: 'flex' }}>
				<Box sx={{ mt: 'auto', mb: 'auto' }}>
					<Typography>{effect} happen if {cause.toLowerCase()}:</Typography>
				</Box>
				<Box>
					<IconButton
						size="large"
						edge="end"
						color="inherit"
						aria-label="Add"
						onClick={() => createConsideration(cause, effect)}
					>
						<AddIcon />
					</IconButton>
				</Box>
			</Box>
			<Box>
				{considerationElements}
			</Box>
		</Box>;
	};

	return	<Box sx={{ mt: '16px', mb: '4px' }} >
				<Box style={{ display: 'flex' }}>
					<Box sx={{ margin: 'auto', flexGrow: 1 }} >
						<TextField
							id='decision'
							label='Decision'
							size='small'
							fullWidth={true}
							inputProps={{ style: { textAlign: 'center' } }}
							defaultValue={decision || ''}
							onChange={handleDecisionChange}
							onBlur={handleDecisionBlur}
						/>
					</Box>
				</Box>
				<TableContainer component={Paper} >
					<Table sx={{ height: '80vh' }}>
						<TableBody>
							<TableRow>
								<TableCell style={{ borderRight: border }}>
									{renderConsiderations('Done', 'Will')}
								</TableCell>
								<TableCell>
									{renderConsiderations('Done', "Will not")}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell style={{ borderRight: border }}>
									{renderConsiderations('Not done', 'Will')}
								</TableCell>
								<TableCell>
									{renderConsiderations('Not done', 'Will not')}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</TableContainer>
			</Box>;

}

