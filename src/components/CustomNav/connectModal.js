import { Divider, Modal } from "antd";
import React, { useEffect, useState } from "react";
// import { useAccount, useConnect } from "wagmi";
import { useIsMounted } from "../../hooks/useIsMounted";
import MetaMask from "../../../static/img/MetaMask.png"
import WalletConnect from "../../../static/img/WalletConnect.png"



export default function ConnectModal(props) {
    
    const { isOpen, setIsOpen } = props;
    const isMounted = useIsMounted();
    // const { connect, connectors } = useConnect();
    // const { connector, isReconnecting } = useAccount({
    //     onConnect() {
    //         handleCancel()
    //     }
    // })
    const [ isShow, setIsShow ] = useState(false);

    function handleOk() {
        setIsOpen(true)
    }

    function handleCancel() {
        setIsOpen(false)
    }

    useEffect(() => {
        setIsShow(isOpen)
    },[isOpen])

    return (
        <Modal
            open={isShow}
            onOk={handleOk} 
            onCancel={handleCancel}
            className="ModalConnect" 
            footer={null}
            closeIcon={<></>}
            width={500}
            centered
        >
            {/* {
                connectors.map((x,i) => (
                    <div key={x.name}>
                    <div
                        className="wallet-item"
                        disabled={!x.ready || isReconnecting || connector?.id === x.id}
                        onClick={() => connect({ connector: x })}
                    >
                        <div className="item">
                            <div className="img">
                                {
                                    x.name === 'MetaMask' ? 
                                        <img src={MetaMask} alt="" />
                                        :
                                        <img src={WalletConnect} alt="" />
                                }
                            </div>
                            <p className="name">
                                {x.id === 'injected' ? (isMounted ? x.name : x.id) : x.name}
                            </p>
                            <p className="tips">
                                {x.name === 'MetaMask' ? 
                                'Connect to your MetaMask Wallet'
                                :'Scan with WalletConnect to connect'
                                }
                            </p>
                        </div>
                    </div>
                    {
                        i < connectors.length-1 &&
                        <Divider />
                    }
                    </div>
                ))
                } */}
        </Modal>
    )
}