import React, { useState } from 'react';
import { Button, Dropdown } from "antd";
import "../../css/component/customNav.scss"
import logo from "../../../static/img/logo-black.png"
import { useAccount, useConnect, useDisconnect } from "wagmi";
import ConnectModal from './connectModal';
import { hashAvatar, nickName } from '../../utils/common';
import {
    MenuOutlined,
    CloseOutlined,
    GlobalOutlined
  } from '@ant-design/icons';
import json from "./i18n.json";
import Link from '@docusaurus/Link';
// import DocBreadcrumbs from '../../theme/DocBreadcrumbs';

export default function CustomNav() {

    const [ isOpen, setIsOpen ] = useState(false);
    const { address, isConnected, connector } = useAccount();
    const { disconnect: dis } = useDisconnect();
    let [isOpenM, setIsOpenM] = useState(false);
    let [language, setLanguage] = useState("cn");
    

    const items = [
        {
            label: (<a href={`https://decert.me/user/${address}`}>个人中心</a>),
            key: '1',
            icon: '',
        },
        {
            label: (<a href={`https://decert.me/${address}`}>认证</a>),
            key: '2',
            icon: '',
        },
        {
            label: (<p onClick={disconnect}>{json[language].disconnect}</p>),
            key: '3',
            icon: '',
        }
    ];
    
    async function disconnect() {
        // await connector.disconnect();
        dis();
        // console.log(isConnected);
    }

    function toggleI18n() {
        language = language === "cn" ? "en" : "cn";
        setLanguage(language);
    }

    const menus = [
        { to: "https://decert.me/tutorials", label: json[language].lesson },
        { to: "https://decert.me/challenges", label: json[language].explore },
        { to: "https://decert.me/vitae", label: json[language].cert }
    ]

    return (
        <>
        <div className="Header">
            <div className="header-content">
                <div className='nav-left'>
                    <div className="logo">
                        <img src={logo} alt="" />
                    </div>
                    {
                        menus.map((e,i) => 
                            <a href={e.to} key={i}>
                                {e.label}
                            </a>    
                        )
                    }
                </div>
                {
                    typeof window !== 'undefined' && window?.screen.width <= 996 ? 
                    <div className='nav-right'>
                        {
                            isConnected && !isOpenM &&
                                <Dropdown
                                    placement="bottomRight" 
                                    menu={{items}}
                                    overlayStyle={{
                                        width: "160px",
                                        fontWeight: 500
                                    }}
                                >
                                    <div className="user">
                                        <img src={hashAvatar(address)} alt="" />
                                    </div>
                                </Dropdown>
                        }
                            
                            <div 
                                className={isOpenM ? "cfff":""}
                                style={{fontSize: "16px"}}
                                onClick={() => {setIsOpenM(!isOpenM)}} 
                            >
                                {
                                    isOpenM ?
                                    <CloseOutlined />
                                    :
                                    <MenuOutlined /> 
                                }
                            </div>
                            <div className={`mask-box ${isOpenM ? "mask-box-show" : ""}`}>
                                <ul>
                                    {
                                        menus.map((e,i) => 
                                            <a href={e.to} key={i}>
                                                <li>
                                                    {e.label}
                                                </li>
                                            </a>    
                                        )
                                    }
                                    
                                    <li className="toggle" onClick={() => toggleI18n()}>
                                        <GlobalOutlined className='icon' />
                                        <p>{language === 'cn' ? "中文" : "EN"}</p>
                                    </li>
                                </ul>

                                {
                                    isConnected ?
                                    <Button danger type="primary" onClick={() => disconnect()}>{json[language].disconnect}</Button>
                                    :
                                    <Button onClick={() => setIsOpen(true)}>{json[language].connect}</Button>
                                }
                            </div>
                        
                    </div>
                    :
                    <div className='nav-right'>
                        <Button
                            type="ghost"
                            ghost
                            className='lang'
                            onClick={() => toggleI18n()}
                        >
                            {language === 'cn' ? "中文" : "EN"}
                        </Button>
                        {
                            isConnected ? (
                                <Dropdown
                                    placement="bottom" 
                                    arrow
                                    menu={{items}}
                                >
                                    <div className="user">
                                        <img src={hashAvatar(address)} alt="" />
                                        <p>{nickName(address)}</p>
                                    </div>
                                </Dropdown>
                            )
                            :
                            (
                                <div>
                                    <Button onClick={() => setIsOpen(true)}>{json[language].connect}</Button>
                                </div>
                            )
                        }
                    </div>
                }
            </div>
            <ConnectModal isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
        {/* <DocBreadcrumbs /> */}
        </>
    )
}
                