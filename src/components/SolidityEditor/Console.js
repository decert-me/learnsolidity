import React, { useEffect } from "react"

export default function Console(props) {
    const { log } = props;

    function scrollTopChange() {
        var element = document.querySelector(".console");
        element.scrollTop = element.scrollHeight;
    }

    useEffect(() => {
        scrollTopChange()
    },[log])

    return (
        log.length > 0 &&
        <div className="console">
            {
                log.map((e,i) => 
                    <p key={i}>{e}</p>
                )
            }
        </div>
    )
}