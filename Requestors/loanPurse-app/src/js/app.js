App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  // url: 'http://127.0.0.1:7545',
  contractOwner: null,
  currentAccount1: null,
  myRepayAmount: 0,
  loanCount:0,
  loanAmount: 0,
  // network_id: 5777,
  address: '0x2f0Eb24ab1B58E0804Cd03C7EC8215B32d82df72',


  init: function() {
    //console.log("Checkpoint 0")
    return App.initWeb3();
    
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } 
    else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);
    ethereum.enable();
    return App.initContract();
    
  },

  initContract: function() {
      App.contracts.loanPurse = web3.eth.contract(App.abi).at(App.address);
      App.currentAccount1 = web3.eth.coinbase;
      App.getcontractOwner();
      console.log("looking here ",App.currentAccount1);
      return App.bindEvents();
  },

  bindEvents: function () {

    // Requestor function events
    $(document).on("click", ".btn-requestLoan", App.handleRequestLoan);
    $(document).on('click', '.btn-calRepayAmt', App.handleCalculateRepayAmt);
    $(document).on('click', '.btn-repayLoan', App.handleRepayLoan);

  },

    // get the smart contract owner/Lender
    getcontractOwner: function() {
      App.contracts.loanPurse.lender((e, result) =>{
        if(!e){
          App.contractOwner = result
          if(App.currentAccount1 == App.contractOwner){
            console.log("here 0");
            $(".right-len").css("display", "inline");
          }
          else {
            console.log("here 1");
            $(".left-req").css("display", "inline");
          }
        }
      })
    },

  // ################ Requestor functions #####################
  handleRequestLoan: function() {
    event.preventDefault();
    var loanAmt = $("#loan_amt").val();
    if (loanAmt == "" || loanAmt < 1 || loanAmt >10){
      alert("Please input a Loan Amount greater than 0 ETH and less than 10 ETH");
      return false;
    } 
    else{
    App.contracts.loanPurse.requestLoan(loanAmt,(err, result)=>{
      if(!err){
        function pendingConfirmation(){
          web3.eth.getTransactionReceipt(result,(e,rec)=>{
            if(rec){
              clearInterval(myInterval);
              if(parseInt(rec.status) ==1){
                toastr.info("Your Loan Request is Submitted!", "", {"iconClass": 'toast-info notification'})
              }
              else{
                toastr["error"]("Error in Requesting Loan.");
              }
            }
            if(e){
              clearInterval(myInterval);
              console.log(e)
            }
            })
        }
        const myInterval = setInterval(pendingConfirmation, 3000);
      }
      else{
        console.log(err)
        toastr["error"]("Loan Request Failed!")
      }
          })

        }
    },


  handleCalculateRepayAmt: function() {
    event.preventDefault();
    var borrowerAddress = $("#calc_repay").val();
    var reqLoanAmt = $("#cal_LoanAmt").val();
    if (borrowerAddress == ""){
      alert("Please input the Requestor Address");
      return false;
    } 
    else if (reqLoanAmt == "" || reqLoanAmt < 1 ) {
      alert("Please input the Loan Amount to calculate Repay Amount");
      return false;
    }
    else{
      App.contracts.loanPurse.calculateRepay(borrowerAddress, reqLoanAmt,(err, result)=>{
        if(!err){

          function pendingConfirmation(){
    
            web3.eth.getTransactionReceipt(result, (e,receipt)=>{
              if(receipt){
                clearInterval(myInterval);
                console.log(receipt);
              App.contracts.loanPurse.allEvents({
                fromBlock: 0,
                toBlock: 'latest',
                address: App.address,
                topics: [[web3.sha3('myCalc(uint)')]]
              },
              function(error, log){
                if(!error){
                  if(log.transactionHash == receipt.logs[0].transactionHash){
                var myRepayAmount = log.args.myRepay.toNumber();
                toastr.info("Your Repay Loan Amount is Calculated successfully!", "", {"iconClass": 'toast-info notification'});
                $("#viewRepay").text(myRepayAmount + " ETH");
                  }
                }
              }); //App.contracts close
              }
              
              if(e){
                clearInterval(myInterval);
              }
             })
          }
          const myInterval = setInterval(pendingConfirmation, 3000);
        }
        else{
          console.log(err);
          toastr["error"]("Repay Loan Amount Calculation Failed!");
        }

      })
    }
  },


  handleRepayLoan: function() {
    event.preventDefault();
    var lenderAdd = $("#loan_repay").val();
    var calcRepayAmt = $("#loan_repayAmt").val();
    var msgValue = $("#message_value1").val();
    if (lenderAdd == ""){
      alert("Please input the Lender Address");
      return false;
    }
    else if (calcRepayAmt == "" || calcRepayAmt < 1) {
      alert("Please input the calculated Repay Amount");
      return false;
    }
    else if (msgValue == "" ||  msgValue < calcRepayAmt) {
      alert("Please input the Deposit Amount greater than Repay Amount");
      return false;
    }
    else{
      App.contracts.loanPurse.repayLoan(lenderAdd, calcRepayAmt, {value: web3.toWei(msgValue, "ether")}, (err, result)=>{
        if(!err){
          function pendingConfirmation(){
            web3.eth.getTransactionReceipt(result,(e,rec)=>{
              if(rec){
                clearInterval(myInterval);
                if(parseInt(rec.status) ==1){
                  toastr.info("Your Loan Amount Repayment is done successfully!", "", {"iconClass": 'toast-info notification'})
                }
                else{
                  toastr["error"]("Error in Loan Repayment.");
                }
              }
              if(e){
                clearInterval(myInterval);
                console.log(e)
              }
              })
          }
          const myInterval = setInterval(pendingConfirmation, 3000);
        }
        else{
          console.log(err)
          toastr["error"]("Loan Repayment Failed!")
        }
            })
  
          }
      },
  

  showNotification: function (text, type){
    toastr.info(text, "", {iconClass: "toast-info notification" + String(type),
      });
    },
    abi: [
      {
        "constant": true,
        "inputs": [],
        "name": "calRepayAmount",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "amount",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "lender",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [],
        "name": "Initialized",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [],
        "name": "LoanRequested",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [],
        "name": "LoanApproved",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [],
        "name": "LoanRejected",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [],
        "name": "LoanRepaid",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "myRepay",
            "type": "uint256"
          }
        ],
        "name": "myCalc",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "loanCount1",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "loanAmt1",
            "type": "uint256"
          }
        ],
        "name": "loanCreditHistory",
        "type": "event"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "loanAmount",
            "type": "uint256"
          }
        ],
        "name": "requestLoan",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "requestorAddress",
            "type": "address"
          }
        ],
        "name": "approveLoan",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "requestorAddress",
            "type": "address"
          }
        ],
        "name": "rejectLoan",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "requestorAddress",
            "type": "address"
          }
        ],
        "name": "creditHistory",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "addr",
            "type": "address"
          }
        ],
        "name": "checkBalance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "requestorAddress",
            "type": "address"
          },
          {
            "name": "requestedLoanAmount",
            "type": "uint256"
          }
        ],
        "name": "calculateRepay",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "lenderAddress",
            "type": "address"
          },
          {
            "name": "repayAmt",
            "type": "uint256"
          }
        ],
        "name": "repayLoan",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      }
    ]

};


  $(function () {
    $(window).load(function () {
      App.init();
      //Notification UI config
      toastr.options = {
        "showDuration": "1500",
        "positionClass": "toast-top-left",
        "preventDuplicates": true,
        "closeButton": true,
      };
    });
  });
