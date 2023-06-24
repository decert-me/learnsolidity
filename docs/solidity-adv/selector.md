



## 获取函数选择器

数组切片在获取calldata中的ABI解码数据的时候非常有用，示例代码如下：

```solidity
pragma solidity >=0.5.0 ;

contract Proxy {
    /// 被当前合约管理的客户端合约地址
    address client;

    constructor(address _client) public {
        client = _client;
    }

    /// 在进行参数验证之后，转发到由client实现的"setOwner(address)"
    function forward(bytes calldata _payload) external {
        
        bytes4 sig = abi.decode(_payload[:4], (bytes4));
        
        if (sig == bytes4(keccak256("setOwner(address)"))) {
            address owner = abi.decode(_payload[4:], (address));
            require(owner != address(0), "Address of owner cannot be zero.");
        }
        (bool status,) = client.delegatecall(_payload);
        require(status, "Forwarded call failed.");
    }
}
```

 