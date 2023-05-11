import React, { useEffect, useState } from "react"

import MonacoEditor from "./MonacoEditor";
import { loader } from "@monaco-editor/react";
import {
    LoadingOutlined,
} from '@ant-design/icons';

const loading = (
    <LoadingOutlined style={{color: "#fff", fontSize: "30px"}} />
)

export default function CustomEditor(props) {
    
    const { value, onChange, isOk, language } = props;
    const { config, init } = loader;
    let [editorIsOk, setEditorIsOk] = useState();


    async function monacoInit(params) {
        config({
            paths: {
                vs: "https://ipfs.decert.me/lib/monaco-editor@0.36.1"
            },
            // monaco: monaco
        })
        await init();
        setEditorIsOk(true);
    }

    useEffect(() => {
        monacoInit();
    },[])

    return (
        editorIsOk ?
        <MonacoEditor
            value={value}
            onChange={onChange}
            isOk={isOk}
            language={language}
            loading={loading}
        />
        :
        loading
    )
}