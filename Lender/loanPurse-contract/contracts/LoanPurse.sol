pragma solidity >=0.4.22 <=0.6.0;

contract  LoanPurse {
        address payable public lender;  // owner of the contract who deploy the contract
        uint public calRepayAmount; // calculate the Repay Amount based on predefined interest rate
        uint noOfLoan=0;  // count of total loans
        uint amt;
        mapping(address => Loan) loans; // mapping address to loan
        mapping(address => uint) public amount;
 
        // Events are defined here
        event Initialized();
        event LoanRequested();
        event LoanApproved();
        event LoanRejected();
        event LoanRepaid();
        event myCalc(uint myRepay);
        event loanCreditHistory(uint loanCount1 , uint loanAmt1 );

        // Loan structure
        struct Loan {  
           uint id;
           address borrower;
           uint loanAmount;
           string loanStatus;
       }
       
        // modifier to check the functions which are applicable to only Lender can be done 
        // by Lender (e.g. approveLoan, rejectLoan)
        modifier onlyLender()
        { require(msg.sender == lender);
            _;
        }
        
        // modifier to check the functions which are not applicable to Lender can not be done 
        // by Lender (e.g. requestLoan, repayLoan)
        modifier notLender()
        { require(msg.sender != lender);
            _;
        }
        
        // constructor() is executed when the smart contract is deployed into the network
        // and `msg.sender` which is the lender/owner, is the account creating this contract.
        constructor () public {
            lender = msg.sender;		
            
            emit Initialized();
        }
        
        // function to request Loan by borrower to lender by giving few details about the borrower and reason for loan
        function requestLoan(uint loanAmount) notLender public {
            // add Loan object to mapping
            amount[msg.sender] = loanAmount * 1000000000000000000;
            loans[msg.sender] = Loan(noOfLoan, msg.sender, loanAmount, "Loan Requested");
            
            emit LoanRequested();
        }
        
        // function to approve the loan request by lender and transfer the loan amount to borrower account
        function approveLoan(address payable requestorAddress) onlyLender payable public {
            require(msg.sender == lender);
            require(msg.value > amt, "Insufficient Balance.");
            amt = amount[requestorAddress];
            requestorAddress.transfer(amt);
            
            uint tempBalance = 0;
            tempBalance = msg.value - amt;
            msg.sender.transfer(tempBalance);
            
            noOfLoan++;
            loans[requestorAddress] = Loan(noOfLoan, requestorAddress, amt, "Loan Request Approved");
            emit LoanApproved();
        }
    
        // function to reject the loan request by lender 
        function rejectLoan(address requestorAddress) onlyLender public {
            require(msg.sender == lender);
            loans[requestorAddress].loanStatus="Loan Request Rejected";
  
            emit LoanRejected();
        }
        
        // function to get the loan/creditHistory details of the borrower account address
        // function creditHistory(address requestorAddress) view public returns(uint, uint, string memory) {
        //     Loan memory loanDetails = loans[requestorAddress];
        //     return (loanDetails.id, (loanDetails.loanAmount / 1000000000000000000), loanDetails.loanStatus);
        // }

         function creditHistory(address requestorAddress) public returns(uint , uint) {
            Loan memory loanDetails = loans[requestorAddress];
            uint loanCount = loanDetails.id;
            uint loanHist = (loanDetails.loanAmount / 1000000000000000000);
            // string memory loanStats = loanDetails.loanStatus;
            emit loanCreditHistory(loanCount , loanHist);
            // return (loanCount = loanDetails.id, loanAmt = (loanDetails.loanAmount / 1000000000000000000));
            
            return (loanCount , loanHist );
         }
        
        // Check current Balance of the selected address
        function checkBalance(address addr) view public returns(uint){
            return (addr.balance / 1000000000000000000);
           
        }
        
        // function to check whether borrower is able to repay the amount to lender's account address
        function calculateRepay(address requestorAddress, uint requestedLoanAmount) notLender public returns (uint){
            // Calculating repay amount based on predefined interest rate on principal amount(loanAmount)
            calRepayAmount = (((amount[requestorAddress] *10*2)/100) + requestedLoanAmount * 1000000000000000000)/ 1000000000000000000 ;
            emit myCalc(calRepayAmount);
            return calRepayAmount;
        }
        
        
        function repayLoan(address payable lenderAddress, uint repayAmt) notLender public payable {
            require(msg.sender.balance >= repayAmt);
            require(msg.value > repayAmt+10000000000000000000, "Insufficient Balance.");
			require(repayAmt == calRepayAmount);
            
            // transfer the calculated Repay Amount to Lender's account
            lenderAddress.transfer(calRepayAmount * 1000000000000000000);
            
            // Transfer the remaining amount to borrower's account after deducting the repay amount from msg.value amount
            uint tempBalance = 0;
            tempBalance = msg.value - (calRepayAmount * 1000000000000000000);
            msg.sender.transfer(tempBalance);
            loans[msg.sender].loanStatus = "Loan Amount Paid";
            
            emit LoanRepaid();
        }
}