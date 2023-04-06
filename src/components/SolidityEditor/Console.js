import React from "react"

export default function Console(props) {
    const { log } = props;

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