import React from "react";
import { Button } from "antd";

export default function Operation(props) {
    
    const { reload, compliler, loading } = props;

    return (
        <div className="operation">
            <Button onClick={() => reload()} >
                重置
            </Button>
            <Button onClick={() => compliler()} loading={loading} >
                编译 / 部署
            </Button>
        </div>
    )
}