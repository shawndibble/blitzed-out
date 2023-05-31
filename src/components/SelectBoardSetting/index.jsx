import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { dataFolder } from "../../hooks/useCustomize";
import { camelToPascal } from "../../helpers/strings";

export default function SelectBoardSetting({ option, settings, setSettings }) {
    const labelId = option + 'label'; 
    const label = camelToPascal(option);

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
        <div key={option}>
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
        </div>
    );
}

