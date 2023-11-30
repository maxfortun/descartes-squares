import Debug from 'debug';
import React, { useContext, useState, useEffect, useRef } from 'react';

import {
	Box,
	Button,
	Grid,
	FormControl,
	FormControlLabel,
	FormLabel,
	Icon,
	IconButton,
	Paper,
	Radio,
	RadioGroup,
	Switch
} from '@mui/material';

import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import {
	Add as AddIcon,
	ArrowForwardOutlined as ArrowForwardOutlinedIcon
} from '@mui/icons-material';

import { AppContext } from './AppContext';
import Loader from './Loader';
import DSButton from './DSButton';
import DSquare from './DSquare';

export default function (props) {
	const { session, setSession } = useContext(AppContext);
	const [ dSquares, setDSquares ] = useState(null);
	const [ dSquare, setDSquare ] = useState({});

	const debug = Debug('descartes-dSquares:DSquares:'+session.account.email);

	debug("DSquares", props);

	const fetchDSquares = async () => {
		debug('fetchDSquares');
		return fetch('/api/squares', { credentials: 'include' })
		.then(response => response.json())
		.then(dSquares => {
			debug('fetchDSquares', dSquares);
			setDSquares(dSquares);
			if(localStorage.dSquareId && dSquares.filter(square => square.id == localStorage.dSquareId).length > 0) {
				setDSquare({ id: localStorage.dSquareId } );
			} else if(dSquares.length > 0) {
				setDSquare({ id: dSquares[0].id });
			}
			return dSquares;
		});
	};

	const didMount = useRef(false); 
	useEffect(() => {
		if(!didMount.current) { 
			didMount.current = true;
			debug('useEffect', 'mounted');
			fetchDSquares();
			return;
		} 
	});

	useEffect(() => {
		if(dSquare.id) {
			localStorage.dSquareId = dSquare.id;
		}
	}, [dSquare]);


	if(!dSquares) {
		return <Loader />;
	}

	const buttons = dSquares.map((_dSquare, i) => <DSButton key={i} setDSquare={setDSquare} dSquare={_dSquare} />);

	buttons.push(
		<IconButton
			key={buttons.length}
			size="large"
			edge="end"
			color="inherit"
			aria-label="Menu"
			onClick={() => setDSquare({})}
		>
			<AddIcon />
		</IconButton>
	);

	return	<Box sx={{ mt: '4px' }}>
				<Box>
					{buttons}
				</Box>
				<Box>
					{<DSquare dSquare={dSquare} />}
				</Box>
			</Box>;

}

