import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { dataFolder } from "../../hooks/useCustomize";
import { camelToPascal } from "../../helpers/strings";

export default function SelectKink({ option, kinks, setKinks }) {
    const labelId = option + 'label'; 
    const label = camelToPascal(option);

    function getOptions(category) {
        return Object.keys(dataFolder[category]).map((option, index) => (
            <MenuItem value={index} key={`${category}-${index}`}>{option}</MenuItem>
        ));
    }
    
    function handleChange(event, kink) {
        kinks[kink] = event.target.value;
        setKinks({ ...kinks });
    }
    
    return (
        <div key={option}>
            <FormControl fullWidth margin="normal">
                <InputLabel id={labelId}>{label}</InputLabel>
                <Select
                    labelId={labelId}
                    id={option}
                    label={label}
                    value={kinks[option]}
                    onChange={(event) => handleChange(event, option)}
                >
                    {getOptions(option)}
                </Select>
            </FormControl>
        </div>
    );
}

