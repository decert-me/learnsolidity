import axios from "axios";

export async function GetSign(params) {
    
    const { address, signer, disconnect } = params;
    let message;
    const baseurl = process.env.APP_BASE_URL;
    return await new Promise( async(resolve, reject) => {
        // 1、获取nonce
            await axios.get(`${baseurl}/users/getLoginMessage?address=${address}`)
            .then(res => {
                if (res) {
                    message = res.data.data.loginMessage;
                }
            })
        // 2、获取签名
            await signer?.signMessage(message)
            .then(async(res) => {
                // 3、获取token
                await axios.post(`${baseurl}/users/authLoginSign`, {
                    address: address,
                    message: message,
                    signature: res
                })
                .then(res => {
                    if (res) {
                        localStorage.setItem(`decert.token`,res.data.data.token)
                        setTimeout(() => {
                            resolve();
                        }, 100);
                    }
                })
            })
            .catch(err => {
                reject(err);
                disconnect();
            })
    });
}