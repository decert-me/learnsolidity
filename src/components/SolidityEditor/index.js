import React, { useEffect, useState } from "react";
import CustomEditor from "../CustomEditor";


export default function SolidityEditor(props) {
    
    const { children } = props;
    let [value, setValue] = useState();

    function onChange(newValue) {
        setValue(newValue)
    }

    function reload() {
        setValue(children.trim())
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
        </div>
    )
}