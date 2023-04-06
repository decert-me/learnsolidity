import React from "react";
import { Button, Form, Input, InputNumber } from "antd";

export default function Inner(props) {
    
    const { inputs, name, callFunc } = props;

    const onFinish = (values) => {
        console.log('Success:', values);
        // return
        let args = [];
        for (const i in values) {
            args.push(values[i])
        }
        callFunc(name, args);
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <Form
            name="basic"
            initialValues={{
                remember: true,
            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            layout="vertical"
        >
            {
                inputs.map((e,i) => 
                    <Form.Item
                        label={`${e.name} (${e.type})`}
                        name={e.name}
                        key={i}
                        rules={[
                            {
                            required: true,
                            message: `Please input your ${e.name}!`,
                            },
                        ]}
                    >
                        {
                            e.type.indexOf("uint") !== -1 ? 
                            <InputNumber controls={false} style={{width: "100%"}} />
                            :
                            <Input />
                        }
                    </Form.Item>
                )
            }

            <Form.Item
            wrapperCol={{
                offset: 8,
                span: 16,
            }}
            >
            <Button type="primary" htmlType="submit">
                write
            </Button>
            </Form.Item>
        </Form>
    )
}