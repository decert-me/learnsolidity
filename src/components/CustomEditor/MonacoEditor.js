import React, { useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { constans } from "../../utils/constans";


export default function MonacoEditor(props) {
    
    const { value, onChange, isOk, language, loading } = props;
    const { languages } = constans();
    const monaco = useMonaco();

    const options = {
        minimap: { enabled: false },  // 隐藏侧边栏
    };

    function editorInit(params) {
        isOk(true);
        monaco.languages.register({ id: 'solidity' });
        monaco.languages.setMonarchTokensProvider('solidity', languages.solidity);
    }

    function languageSwitch(params) {
        
        switch (language) {
            case "solidity":
                editorInit();
                break;
        
            default:
                isOk(true);
                break;
        }
    }
    
    useEffect(() => {
        monaco && languageSwitch();
    },[monaco])
    return (
        <Editor
            // width="800"
            height="300px"
            theme="vs-dark"
            language={language}
            value={value}
            options={options}
            onChange={onChange}
            loading={loading}
        /> 
    )
}