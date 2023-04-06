import React, { useEffect, useState } from "react";
import CustomEditor from "../CustomEditor";
import Console from "./Console";
import Operation from "./Operation";
import "../../css/component/solidityEditor.scss"

export default function SolidityEditor(props) {
    
    const { children } = props;
    let [initEditor, setInitEditor] = useState(false);
    let [value, setValue] = useState();
    let [log, setLog] = useState([1,1,1,1,1,1,1,1,]);

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

    useEffect(() => {
        children && reload()
    },[children])

    return (
        <div className="solidityEditor">
            <CustomEditor 
                onChange={onChange} 
                value={value}
                isOk={setInitEditor}
            />
            {
                initEditor && 
                <>
                    <Operation 
                        reload={reload} 
                        changeLog={changeLog}
                    />
                    <Console 
                        log={log}
                    />
                </>
            }
        </div>
    )
}