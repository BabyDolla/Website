"use strict";const contractAddr='0xaC784783054479ea14B96174eaa85C12b2DBFF3f';const dividendTokenAddr='0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';const bnbAddr='0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';let totalHolders=0;let tokenInfo,dividendTokenInfo;let secondsUntilAutoClaimAvailable=0;let claimCountdownInterval=null;const Web3Modal=window.Web3Modal.default;const WalletConnectProvider=window.WalletConnectProvider.default;const Fortmatic=window.Fortmatic;const evmChains=window.evmChains;let web3Modal;let provider;let web3;let contract;let selectedAccount;function init(){if(location.protocol!=='https:'){const alert=document.querySelector("#alert-error-https");alert.style.display="block";document.querySelector("#btn-connect").setAttribute("disabled","disabled");return;}
const providerOptions={walletconnect:{package:WalletConnectProvider,display:{name:'Trust Wallet/MetaMask/Mobile'},options:{rpc:{56:'https://bsc-dataseed1.ninicoin.io'},network:'binance',}}};web3Modal=new Web3Modal({cacheProvider:false,providerOptions,disableInjectedProvider:false,});}
async function initContract(){const accounts=await web3.eth.getAccounts();selectedAccount=accounts[0];const newContract=new web3.eth.Contract(contractAbi,contractAddr,{from:selectedAccount,});return newContract;}
async function fetchPancakeData(){const respDividendToken=await fetch('https://api.pancakeswap.info/api/v2/tokens/'+dividendTokenAddr);dividendTokenInfo=await respDividendToken.json();const responseToken=await fetch('https://api.pancakeswap.info/api/v2/tokens/'+contractAddr);tokenInfo=await responseToken.json();}
async function fetchTokenData(){contract.methods.getNumberOfDividendTokenHolders().call().then(function(value){totalHolders=value;});contract.methods.getTotalDividendsDistributed().call().then(function(value){document.querySelector("#dividends-distributed").textContent=amountToStr(dividendToNumber(web3,value),0)+' '+dividendTokenInfo.data.symbol;});}
async function fetchData(){let tokenBalance=0;clearCountdownInterval();clearAccountInfo();await fetchPancakeData();await fetchTokenData();document.querySelector("#token-price").textContent=parseFloat(tokenInfo.data.price).toFixed(9)+'$';contract.methods.balanceOf(selectedAccount).call().then(function(balance){tokenBalance=tokenToNumber(web3,balance);document.querySelector("#token-balance").textContent=amountToStr(tokenBalance,3);return contract.methods.getAccountDividendsInfo(selectedAccount).call();}).then(function(values){const iterationsLeft=values[2];const withdrawableDividends=values[3];const totalDividends=values[4];const lastClaimTime=values[5];const nextClaimTime=values[6];secondsUntilAutoClaimAvailable=values[7];const dividendsPayed=dividendToNumber(web3,web3.utils.toBN(totalDividends).sub(web3.utils.toBN(withdrawableDividends)));document.querySelector("#dividends-payed").textContent=amountToStr(dividendsPayed,2)+' '+dividendTokenInfo.data.symbol;if(lastClaimTime>0){const lastPayment=new Date(lastClaimTime*1000);document.querySelector("#last-payment").textContent=lastPayment.toLocaleDateString()+' '+lastPayment.toLocaleTimeString();}
document.querySelector("#withdrawable-dividends").textContent=amountToStr(dividendToNumber(web3,withdrawableDividends),2)+' '+dividendTokenInfo.data.symbol;document.querySelector("#auto-payment-bar").style.width=(iterationsLeft*100/totalHolders).toString()+'%';if(dividendToNumber(web3,withdrawableDividends)==0){document.querySelector("#btn-claim-text").textContent="Claim my dividends";document.querySelector("#btn-claim").setAttribute("disabled","disabled");}
else{claimCountdownInterval=setInterval(function x(){secondsUntilAutoClaimAvailable--;if(secondsUntilAutoClaimAvailable>0){document.querySelector("#btn-claim-text").textContent="Claim in "+secondsUntilAutoClaimAvailable+" secs";document.querySelector("#btn-claim").setAttribute("disabled","disabled");}else{document.querySelector("#btn-claim-text").textContent="Claim my dividends";document.querySelector("#btn-claim").removeAttribute("disabled");clearCountdownInterval();}
return x;}(),1000);}}).then(function(){showEstimations(tokenBalance);document.querySelector("#prepare").style.display="none";document.querySelector("#connected").style.display="block";document.querySelector("#button-bar").style.display="block";}).catch(function(err){document.querySelector("#btn-claim").setAttribute("disabled","disabled");});}
function showEstimations(tokenBalance){let supplyRatio=tokenBalance/(10**11);let dailyVolume=document.querySelector("#daily-volume-txt").value;let hourlyVolume=dailyVolume/24;let hourlyDividendsGenerated=(hourlyVolume*0.12*tokenInfo.data.price)/dividendTokenInfo.data.price;let userDividendsPerHour=hourlyDividendsGenerated*supplyRatio;let userDividendsPerDay=24*userDividendsPerHour;let userDividendsPerWeek=7*24*userDividendsPerHour;let userDividendsPerMonth=30*24*userDividendsPerHour;document.querySelector("#estimation-hour").textContent=userDividendsPerHour.toFixed(2)+" "+dividendTokenInfo.data.symbol;document.querySelector("#estimation-day").textContent=userDividendsPerDay.toFixed(2)+" "+dividendTokenInfo.data.symbol;document.querySelector("#estimation-week").textContent=userDividendsPerWeek.toFixed(2)+" "+dividendTokenInfo.data.symbol;document.querySelector("#estimation-month").textContent=userDividendsPerMonth.toFixed(2)+" "+dividendTokenInfo.data.symbol;}
function clearAccountInfo(){document.querySelector("#token-balance").textContent="0";document.querySelector("#dividends-payed").textContent="0";document.querySelector("#last-payment").textContent="-";document.querySelector("#withdrawable-dividends").textContent="-";document.querySelector("#auto-payment-bar").style.width='0%';document.querySelector("#btn-claim").setAttribute("disabled","disabled");}
function clearCountdownInterval(){if(claimCountdownInterval!=null){clearInterval(claimCountdownInterval);claimCountdownInterval=null;}}
function tokenToNumber(web3,amount){return parseFloat(web3.utils.fromWei(amount,"ether"));}
function dividendToNumber(web3,amount){return parseFloat(web3.utils.fromWei(amount,"ether"));}
function amountToStr(amount,decimals){return amount.toLocaleString(undefined,{maximumFractionDigits:decimals});}
async function refreshAccountData(){document.querySelector("#connected").style.display="none";document.querySelector("#prepare").style.display="block";document.querySelector("#btn-connect").setAttribute("disabled","disabled");document.querySelector("#btn-disconnect").setAttribute("disabled","disabled");document.querySelector("#btn-refresh").setAttribute("disabled","disabled");document.querySelector("#btn-claim").setAttribute("disabled","disabled");await fetchData(provider);document.querySelector("#btn-connect").removeAttribute("disabled");document.querySelector("#btn-disconnect").removeAttribute("disabled");document.querySelector("#btn-refresh").removeAttribute("disabled");document.querySelector("#btn-claim").removeAttribute("disabled");}
async function onConnect(){try{provider=await web3Modal.connect();web3=new Web3(provider);contract=await initContract();}catch(e){console.log("Could not get a wallet connection",e);return;}
provider.on("accountsChanged",async(accounts)=>{contract=await initContract();await refreshAccountData();});provider.on("chainChanged",async(chainId)=>{contract=await initContract();await refreshAccountData();});await refreshAccountData();}
async function onRefresh(){if(selectedAccount!=null){await refreshAccountData();}}
async function onClaim(){document.querySelector("#btn-claim").setAttribute("disabled","disabled");contract.methods.claim().send().then(function(resp){return refreshAccountData();}).then(function(){});}
async function onDisconnect(){if(selectedAccount==null)return;clearAccountInfo();if(provider.close){await provider.close();await web3Modal.clearCachedProvider();provider=null;}
web3.eth.clearSubscriptions();selectedAccount=null;web3=null;contract=null;clearCountdownInterval();document.querySelector("#prepare").style.display="block";document.querySelector("#connected").style.display="none";document.querySelector("#button-bar").style.display="none";}
window.addEventListener('load',async()=>{init();document.querySelector("#btn-connect").addEventListener("click",onConnect);document.querySelector("#btn-disconnect").addEventListener("click",onDisconnect);document.querySelector("#btn-refresh").addEventListener("click",onRefresh);document.querySelector("#btn-claim").addEventListener("click",onClaim);});