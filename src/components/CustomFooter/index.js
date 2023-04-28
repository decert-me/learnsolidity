import React from 'react';
import Twitter from '../../../static/img/icon-twitter.png'
import Discord from '../../../static/img/icon-discord.png'
import Notion from '../../../static/img/icon-notion.png'
import Github from '../../../static/img/icon-github.png'
import logo_white from "../../../static/img/logo-white.png";
import "../../css/component/customFooter.scss"

export default function AppFooter({ isMobile }) {

    return (
        <div className='Footer'>
            {/* logo info */}
          <div className="left">
            {
              typeof window !== 'undefined' && window.screen.width < 996 ?
              <p className='title'>DeCert.me</p>
              :
              <div className="logo">
                <img src={logo_white} alt="" />
              </div>
            }
            <p className="describe">You are what you build.</p>
            <span className="versions">© 2023 DeCert.me | </span>
            <a href="https://beian.miit.gov.cn/" target="_blank"><span className='versions' style={{color: "#fff"}}>粤ICP备17140514号-3</span></a>
            
          </div>
          {/* right icon */}
          <div className="right">
            <img src={Notion} onClick={()=>{window.open('https://decert.notion.site/Decert-me-8b479c6e443740f192a56f2e090829ab','_blank')}} />
            <img src={Twitter} onClick={()=>{window.open('https://twitter.com/decertme','_blank')}}></img>
            <img src={Discord} onClick={()=>{window.open(`https://discord.gg/${process.env.REACT_APP_DISCORD_VERIFY_INVITE_LINK}`,'_blank')}}/>
            <img src={Github} onClick={()=>{window.open('https://github.com/decert-me','_blank')}} />
          </div>
        </div>
    )
}