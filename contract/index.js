console.clear();
require("dotenv").config();
const {
    AccountId,
    PrivateKey,
    Client,
    FileCreateTransaction,
    ContractCreateTransaction,
    ContractFunctionParameters,
    ContractExecuteTransaction,
    ContractCallQuery,
    Hbar,
    ContractCreateFlow,
} = require("@hashgraph/sdk");
const fs = require("fs");

// Configure accounts and client
const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_PVKEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
    // Import the compiled contract bytecode
    const contractBytecode = fs.readFileSync("Whitelist_sol_Whitelist.bin");

    // Instantiate the smart contract
    const contractInstantiateTx = new ContractCreateFlow()
        .setBytecode(contractBytecode)
        .setGas(200000)
        .setConstructorParameters(new ContractFunctionParameters().addString("Hello Buidler Labs bros").addUint256(111111));
    const contractInstantiateSubmit = await contractInstantiateTx.execute(client);
    const contractInstantiateRx = await contractInstantiateSubmit.getReceipt(client);
    const contractMetaData = await contractInstantiateSubmit.contractMetaData
    const contractId = contractInstantiateRx.contractId;
    const contractAddress = contractId.toSolidityAddress();
    console.log(`- The smart contract ID is: ${contractId} \n`);
    console.log(`- The smart contract ID in Solidity format is: ${contractAddress} \n`);
    console.log(`- MetaDataForVerification ${contractMetaData} \n`);
}
main();