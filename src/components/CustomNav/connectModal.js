import { Divider, Modal, message } from "antd";
import React, { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSigner } from "wagmi";
import { useIsMounted } from "../../hooks/useIsMounted";
import MetaMask from "../../../static/img/MetaMask.png"
import WalletConnect from "../../../static/img/WalletConnect.png"
import { GetSign } from "./getSign";

const { confirm } = Modal;

export default function ConnectModal(props) {
    
    const { isOpen, setIsOpen } = props;
    const [messageApi, contextHolder] = message.useMessage();
    const isMounted = useIsMounted();
    const { data: signer } = useSigner();
    const { disconnect } = useDisconnect();
    const { connect, connectors } = useConnect({
        onSuccess() {
            setIsSign(true)
            handleCancel()
        }
    });
    const { connector, isReconnecting, address } = useAccount()
    const [ isShow, setIsShow ] = useState(false);
    const [ isSign, setIsSign ] = useState(false);

    function handleOk() {
        setIsOpen(true)
    }

    function handleCancel() {
        setIsOpen(false)
    }

    function openModal() {
        confirm({
            title: 'Please sign the message in your wallet.',
            className: "modalSigner",
            icon: <></>,
            maskStyle: {
                backgroundColor: "rgba(0, 0, 0, 0.9)"
            },
            content: null,
            footer: null
          });
    }

    function sign(params) {
        setIsSign(false)
          openModal()
          GetSign({address: address, signer: signer, disconnect: disconnect})
          .then(() => {
              if (localStorage.getItem('decert.token')) {
                  Modal.destroyAll();
              }
          })
          .catch(err => {
              Modal.destroyAll()
          })
    }

    useEffect(() => {
        setIsShow(isOpen)
    },[isOpen])

    useEffect(() => {
        isSign && address && signer && sign()
      },[signer])

    return (
        <>
        {contextHolder}
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
            {
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
                }
        </Modal>
        </>
    )
}