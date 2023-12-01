import Debug from 'debug';
import React, {
	useContext,
	useEffect,
	useRef,
	useState
} from 'react';

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

import { refetch } from './utils';

import { AppContext } from './AppContext';
import Loader from './Loader';
import DSButtons from './DSButtons';
import DSquare from './DSquare';

export default function (props) {

	const { session, setSession } = useContext(AppContext);
	const [ ready, setReady ] = useState(false);
	const [ dSButtons, setDSButtons ] = useState(null);
	const [ dSquares, setDSquares ] = useState(null);
	const [ dSquare, setDSquare ] = useState({});

	const debug = Debug('descartes-squares:DSquares:'+session.account.email);

	const fetchDSquares = async () => {
		debug('fetchDSquares');
		return refetch('/api/squares', { credentials: 'include' })
		.then(response => response.json())
		.then(dSquares => {
			debug('fetchDSquares', dSquares);
			setDSquares(dSquares);
			return dSquares;
		});
	};

	useEffect(() => {
		debug('mounted');
		setReady(true);
	}, []);

	useEffect(() => {
		if(!ready) {
			return;
		}
		fetchDSquares();
	}, [ready]);

	if(!dSquares) {
		return <Loader />;
	}

	const childProps = Object.assign({}, props, 
            			{
            				dSButtons,
            				setDSButtons,
            				dSquares,
            				setDSquares,
            				selectedDSquare: dSquare,
            				setSelectedDSquare: setDSquare
       					}
	);

	return	<Box sx={{ mt: '4px' }}>
				<Box>
					<DSButtons {...childProps} />
				</Box>
				<Box>
					{ null != dSquare.id 
						? <DSquare {...childProps} />
						: <Loader />
					}
				</Box>
			</Box>;

}

