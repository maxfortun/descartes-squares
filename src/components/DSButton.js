import Debug from 'debug';
import React, {
	useContext,
	useState,
	useEffect,
	useRef
} from 'react';

import {
	Button,
	Tooltip
} from '@mui/material';

import { useTheme } from '@mui/material/styles';

import { AppContext } from './AppContext';

export default function (props) {

	const { session, setSession } = useContext(AppContext);
	const [ decision, setDecision ] = useState(props.dSquare.decision);

	const debug = Debug('descartes-squares:DSButton:'+session.account.email);

    useEffect(() => {
		debug('mounted', props);
	}, []);

	const sx={ mr: '4px' };

	const theme = useTheme();

	if(props.dSquare.id == props.selectedDSquare?.id) {
		sx.color = theme.palette.secondary.main;
	}

	return <Button variant='outlined' sx={sx} 
		onClick={() => {
			props.setSelectedDSquare(props.dSquare);
			self.parent.setDecision = setDecision;
		}}
	>{decision}</Button>;
}

