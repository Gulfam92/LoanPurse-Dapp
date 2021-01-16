App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  // url: 'http://127.0.0.1:7545',
  contractOwner: null,
  currentAccount: null,
  myRepayAmount: 0,
  loanCount:0,
  loanAmount: 0,
  // network_id: 5777,
  url: '',


  init: function() {
    //console.log("Checkpoint 0");
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
    $.getJSON('loanPurse.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
        var loanPurseArtifact = data;
        App.contracts.loanPurse = TruffleContract(loanPurseArtifact);
        App.contracts.mycontract = data; // check about this line if it is required

        // Set the provider for our contract
        App.contracts.loanPurse.setProvider(App.web3Provider);
        // get current account
        App.currentAccount = web3.eth.coinbase; 
        jQuery('#current_account').text(web3.eth.coinbase);

        // get balance of current account
        web3.eth.getBalance(web3.eth.coinbase,(b,r)=>{
          jQuery('#balance').text(web3.fromWei(parseInt(r)));
        })
        console.log("here12");
        App.getcontractOwner();
        
        return App.bindEvents();
      });
  },

  bindEvents: function () {
    // Lender function events
    $(document).on("click", ".btn-approveLoan", App.handleApproveLoan);
    $(document).on('click', '.btn-rejectLoan', App.handleRejectLoan);
    $(document).on('click', '.btn-checkCreditHistory', App.handleShowCreditHistory);
  },

    // get the smart contract owner/Lender
  getcontractOwner: function() {
      App.contracts.loanPurse.deployed().then(function(instance){
        return instance.lender();
      }).then(function(result){
        App.contractOwner = result;
        if(App.currentAccount == App.contractOwner){
          console.log("here");
          $(".right-len").css("display", "inline");
        }
        else {
          $(".left-req").css("display", "inline");
        }
      }).catch(function(err){
        console.log(err);
      })
  },


  // ####################### Lender functions #####################
  handleApproveLoan: function(event) {
    var borrowerAddress = $("#approve_loan").val();
    var msgValue = $("#message_value").val();
    if (borrowerAddress == ""){
      alert("Please input the Requestor Address");
      return false;
    }
    else if (msgValue == "") {
      alert("Please input the Deposit Amount");
      return false;
    }
    else{
    App.contracts.loanPurse
    .deployed()
    .then(function(instance){
      return instance.approveLoan(borrowerAddress, {value: web3.toWei(msgValue, "ether") });
    })
    .then(function(result){
      if(result && parseInt (result.receipt.status) == 1){
        App.showNotification("Loan approved and transferred to Requestor account", 4);
      } 
      else{
        App.showNotification("Error during loan approval", 5);
      }
    })
    .catch(function (err){
      console.log(err);
      App.showNotification("Error during loan approval", 5);
    })  
    }
  },

  handleRejectLoan: function(event) {
    var borrowerAddress = $("#reject_loan").val();
    if (borrowerAddress == ""){
      alert("Please input the Requestor Address");
      return false;
    } 
    else{
    App.contracts.loanPurse
    .deployed()
    .then(function (instance){
      return instance.rejectLoan(borrowerAddress);
    })
    .then(function (result){
      if(result && parseInt (result.receipt.status) == 1){
        App.showNotification("Loan got rejected", 4);
      } 
      else{
        App.showNotification("Error during loan rejection", 5);
      }
    })
    .catch(function (err){
      console.log(err);
      App.showNotification("Error during loan rejection", 5);
    })  
    }
  },


  handleShowCreditHistory: function(event) {
    var borrowerAdd = $("#credit_history").val();

    if (borrowerAdd == "" ){
      alert("Please input Requestor Address");
      return false;
    } 
    else{
    App.contracts.loanPurse
    .deployed()
    .then(function (instance){
      return instance.creditHistory(borrowerAdd);
    })
    .then(function (result){
      App.loanCount=result.logs[0].args.loanCount1.toNumber();
      App.loanAmount=result.logs[0].args.loanAmt1.toNumber();
      if(result && parseInt (result.receipt.status) == 1){
        $("#showCredit").text("Loan Count(#): "+App.loanCount + "; " + "  Last Approved Loan Amount: " + App.loanAmount);
        App.showNotification("Credit History Displayed", 4);
      } 
      else{
        App.showNotification("Error during credit history display", 5);
      }
    })
    .catch(function (err){
      console.log(err);
      App.showNotification("Error during request", 5);
    })
    }  
  },

  showNotification: function (text, type){
    toastr.info(text, "", {
      iconClass: "toast-info notification" + String(type),
      });
    },
  },


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
