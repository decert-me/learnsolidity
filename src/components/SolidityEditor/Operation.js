import React, { useState } from "react";
import { Button } from "antd";

export default function Operation(props) {
    
    const { reload, changeLog } = props;
    let [loading, setLoading] = useState(false);

    function initState(params) {
        setContract();
        setContractName();
        abi = []
        setAbi([...abi]);
        setBytecode();
    }

    function initSol(params) {
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
        contractName = result[1];
        setContractName(contractName);
        return input
    }

    async function goCompiler(input) {
        await new Promise((resolve, reject) => {
            solidityCompiler({
                version: 'https://binaries.soliditylang.org/bin/soljson-v0.8.16+commit.07a7930e.js', 
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
        const signer = vmProviderRef.current.provider.getSigner('0x5B38Da6a701c568545dCfcB03FcB875f56beddC4');
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
            <Button onClick={() => reload()} >
                重置
            </Button>
            <Button onClick={() => compiler()} loading={loading} >
                编译 / 部署
            </Button>
        </div>
    )
}