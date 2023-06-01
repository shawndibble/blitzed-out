import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { dataFolder } from "../../../services/buildGame";
import { camelToPascal } from "../../../helpers/strings";
import './styles.css';

export default function SelectBoardSetting({ option, settings, setSettings }) {
    const labelId = option + 'label'; 
    const label = camelToPascal(option);
    const isDualSelect = ['alcohol', 'poppers'].includes(option);

    function getOptions(category) {
        return Object.keys(dataFolder[category]).map((option, index) => (
            <MenuItem value={index} key={`${category}-${index}`}>{option}</MenuItem>
        ));
    }
    
    function handleChange(event, option) {
        settings[option] = event.target.value;
        setSettings({ ...settings });
    }
    
    return (
        <div key={option} className={isDualSelect ? 'dualWidth' : ''}>
            <FormControl fullWidth margin="normal">
                <InputLabel id={labelId}>{label}</InputLabel>
                <Select
                    labelId={labelId}
                    id={option}
                    label={label}
                    value={settings[option] || 0}
                    onChange={(event) => handleChange(event, option)}
                >
                    {getOptions(option)}
                </Select>
            </FormControl>
            {!!isDualSelect && (
                <FormControl fullWidth margin="normal" sx={{ ml: 1 }}>
                   <InputLabel id={labelId + 'Variation'}>{label + ' Variation'}</InputLabel>
                   <Select
                       labelId={labelId + 'Variation'}
                       id={option + 'Variation'}
                       label={label + ' Variation'}
                       value={settings[option + 'Variation'] || 'standalone'}
                       onChange={(event) => handleChange(event, option + 'Variation')}
                   >
                       <MenuItem value="standalone">Standalone</MenuItem>
                       <MenuItem value="appendSome">Append Some</MenuItem>
                       <MenuItem value="appendMost">Append Most</MenuItem>
                   </Select>
               </FormControl> 
            )}
        </div>
    );
}

