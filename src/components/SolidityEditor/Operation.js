import React, { useRef, useState } from "react";
import { Button } from "antd";
import { getCompilerVersions, solidityCompiler } from "../../worker/compiler";
import { deploy } from "../../utils/deploy";
import Abi from "./Abi";
import { getVersion } from "../../utils/getVersion";
import { VmProvider } from "../../worker/deploy";

export default function Operation(props) {
    
    const { reload, changeLog, code } = props;
    const vmProviderRef = VmProvider();
    let [loading, setLoading] = useState(false);
    let [selectVersion, setSelectVersion] = useState();
    let [contract, setContract] = useState();
    let [contractName, setContractName] = useState();
    let [abi, setAbi] = useState([]);
    let [bytecode, setBytecode] = useState();
    let [selectIndex, setSelectIndex] = useState();

    function showInner(i) {
        selectIndex = i === selectIndex ? null : i;
        setSelectIndex(selectIndex);
    }

    function initState() {
        setContract();
        setContractName();
        abi = []
        setAbi([...abi]);
        setBytecode();
    }

    function initSol() {
        var input = {
            language: 'Solidity',
            sources: {
              'test.sol': {
                content: code
              }
            },
            settings: {
              outputSelection: {
                '*': {
                  '*': ['*']
                }
              }
            }
        };
        const regex = /contract\s+(\w+)/;
        const result = code.match(regex);
        // selectVersion
        const version = /pragma solidity ((\^|>=)\d+\.\d+\.\d+|>=\d+\.\d+\.\d+ <\d+\.\d+\.\d+);/;
        const versionResult = code.match(version);

        selectVersion = getVersion(versionResult[1]);
        setSelectVersion(selectVersion);

        contractName = result[1];
        setContractName(contractName);
        return input
    }

    async function getVersions(params) {
        await getCompilerVersions()
        .then(res => {
            console.log(res);
        })
    }

    async function goCompiler(input) {
        await new Promise((resolve, reject) => {
            solidityCompiler({
                version: 'https://ipfs.decert.me/sol/'+selectVersion, 
                input: input
            })
            .then(res => {
                if (res.output.contracts) {
                    changeLog('✅ 编译成功')
                    //  编译成功
                    let data = res.output.contracts;
                    let arr = data["test.sol"][contractName].abi;
                    arr.map(e => {
                        if (e.type === "function") {
                            abi.push(e);
                        }
                    })
                    setAbi([...abi]);
                    bytecode = data["test.sol"][contractName].evm.bytecode.object;
                    setBytecode(bytecode);
                    resolve()
                }else{
                    changeLog('❌ 编译失败')
                    res.output.errors.map(e => {
                        changeLog(e.formattedMessage)
                    })
                    reject()
                }
            })
        })
    }

    async function goDeploy() {
        const signer = await vmProviderRef.getSigner('0x5B38Da6a701c568545dCfcB03FcB875f56beddC4');
        contract = await deploy(abi, bytecode, signer,[]);
        setContract({...contract});
    }

    async function compiler(params) {
        changeLog('开始编译...')
        setLoading(true);
        initState();
        // await getVersions()
        const input = initSol();
        try {
            await goCompiler(input);
        } catch (error) {
            setLoading(false);
            return
        }
        setLoading(false);
        goDeploy()
    }

    return (
        <div className="operation">
            <Button className="btn" onClick={() => reload()} >
                重置
            </Button>
            <Button className="btn" onClick={() => compiler()} loading={loading} >
                编译 / 部署
            </Button>
            {
                contract &&
                <Abi 
                    abi={abi}
                    contractName={contractName}
                    contract={contract}
                    changeLog={changeLog}
                    selectIndex={selectIndex}
                    showInner={showInner}
                />
            }
        </div>
    )
}