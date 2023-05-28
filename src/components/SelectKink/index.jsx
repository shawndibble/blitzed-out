import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { dataFolder } from "../../hooks/useCustomize";

export default function SelectKink({ option, kinks, setKinks }) {
    const labelId = option + 'label'; 
    const word = option.replace(/([A-Z])/g, ' $1').trim();
    const label = word.charAt(0).toUpperCase() + word.slice(1)

    function getOptions(category) {
        let optionArray = [<MenuItem value={0} key={`${category}-0`}><em>None</em></MenuItem>];
        Object.keys(dataFolder[category]).forEach((option, index) => {
            let value = index + 1;
            optionArray.push(<MenuItem value={value} key={`${category}-${value}`}>{option}</MenuItem>);
        });
        return optionArray;
    }
    
    function handleChange(event, kink) {
        let data = kinks;
        data[kink] = event.target.value;
        setKinks({...data });
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

