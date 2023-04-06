import React, { useEffect, useState } from "react";
import CustomEditor from "../CustomEditor";
import Console from "./Console";
import Operation from "./Operation";


export default function SolidityEditor(props) {
    
    const { children } = props;
    let [value, setValue] = useState();
    let [loading, setLoading] = useState(false);
    let [log, setLog] = useState([]);

    function onChange(newValue) {
        setValue(newValue)
    }

    function changeLog(params) {
        log.push(params);
        setLog([...log]);
    }

    function reload() {
        setValue(children.trim())
    }

    function compliler(params) {
        
    }

    useEffect(() => {
        children && reload()
    },[children])

    return (
        <div className="solidityEditor">
            <CustomEditor 
                onChange={onChange} 
                value={value}  
            />
            <Operation 
                reload={reload} 
                compliler={compliler} 
                loading={loading} 
            />
            <Console 
                log={log}
            />
        </div>
    )
}