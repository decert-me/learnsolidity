import React, { useEffect } from "react"
import Editor, { useMonaco } from "@monaco-editor/react";
import { constans } from "../../utils/constans";
export default function CustomEditor(props) {
    
    const { value, onChange } = props;
    const { languages } = constans();
    const monaco = useMonaco();

    const options = {
        minimap: { enabled: false },  // 隐藏侧边栏
    };

    function editorInit(params) {
        monaco.languages.register({ id: 'solidity' });
        monaco.languages.setMonarchTokensProvider('solidity', languages.solidity);
      }
    
    useEffect(() => {
        monaco && editorInit()
    },[monaco])
    return (
        <Editor
            // width="800"
            height="300px"
            theme="vs-dark"
            language="solidity"
            value={value}
            options={options}
            onChange={onChange}
        /> 
    )
}