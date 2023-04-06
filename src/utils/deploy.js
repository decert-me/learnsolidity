import { ethers } from "ethers";

export const deploy = async (abi, bytecode, signer, args) => {
  console.log('deploying contract', abi, bytecode, signer, args);
  const contractFactory = new ethers.ContractFactory(abi, bytecode, signer);
  console.log("ready");
  const instance = await contractFactory.deploy(args);
  console.log("deploy");
  await instance.deployTransaction.wait();
  console.log("end");
  return instance;
}