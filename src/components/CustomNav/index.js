import React, { useEffect, useState } from 'react';
import { Button } from "antd";
import "../../css/component/customNav.scss"
import logo from "../../../static/img/logo-normal.png"
import {
    MenuOutlined,
    CloseOutlined,
    GlobalOutlined
  } from '@ant-design/icons';
import json from "./i18n.json";

export default function CustomNav() {

    let [isOpenM, setIsOpenM] = useState(false);
    let [isMobile, setIsMobile] = useState(false);
    let [language, setLanguage] = useState("cn");
    let [cache, setCache] = useState("");
    
    function toggleI18n() {
        language = language === "cn" ? "en" : "cn";
        setLanguage(language);
    }

    function goHome(params) {
        if (typeof window !== 'undefined') {
            window.open("https://decert.me", "_self");
        }
    }

    const menus = [
        { to: "https://decert.me/tutorials", label: json[language].lesson },
        { to: "https://decert.me/challenges", label: json[language].explore },
        { to: "https://decert.me/vitae", label: json[language].cert }
    ]

    useEffect(() => {
        if (isOpenM) {
          cache = document.querySelector("body").style.cssText;
          setCache(cache);
          document.querySelector("body").style.cssText = cache + "overflow: hidden !important;"
          document.querySelector("#docusaurus_skipToContent_fallback").style.cssText = "z-index: 1;"
        }else{
          document.querySelector("body").style.cssText = cache
          document.querySelector("#docusaurus_skipToContent_fallback").style.cssText = ""
        }
    },[isOpenM])

    useEffect(() => {
        isMobile = document.documentElement.clientWidth <= 996;
        setIsMobile(isMobile);
    },[])

    return (
        <>
        <div className="Header">
            <div className="header-content">
                <div className='nav-left'>
                    <div className="logo" onClick={goHome}>
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
                <div className='nav-right'>
                    {
                        isMobile ?
                        <>
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
                        </>
                        :
                        <Button 
                            type="ghost"
                            ghost
                            className='lang'
                            onClick={() => toggleI18n()}
                        >
                            {language === 'cn' ? "中文" : "EN"}
                        </Button>
                    }
                </div>
            </div>
        </div>
        {
            isMobile &&
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
            </div>
        }
        </>
    )
}
                