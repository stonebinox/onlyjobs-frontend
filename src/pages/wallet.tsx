import React, { useState, useEffect } from "react";
import Head from "next/head";
import {
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  FormErrorMessage,
  Spinner,
  Box,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Icon,
} from "@chakra-ui/react";
import {
  FaDollarSign,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

import DashboardLayout from "../components/Layout/DashboardLayout";
import { useApi } from "@/hooks/useApi";
import Guide from "@/components/Guide/Guide";
import { walletGuideConfig } from "@/config/guides/walletGuide";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Transaction {
  _id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  status: string;
  timestamp: string;
}

const WalletPage = () => {
  const router = useRouter();
  const {
    getWalletBalance,
    createPaymentOrder,
    verifyPayment,
    getTransactions,
  } = useApi();

  const [balance, setBalance] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [customAmountError, setCustomAmountError] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState("");

  const {
    isOpen: isSuccessModalOpen,
    onOpen: onSuccessModalOpen,
    onClose: onSuccessModalClose,
  } = useDisclosure();
  const {
    isOpen: isErrorModalOpen,
    onOpen: onErrorModalOpen,
    onClose: onErrorModalClose,
  } = useDisclosure();

  const cardBg = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const highlightColor = useColorModeValue("blue.500", "blue.300");

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const result = await getWalletBalance();
      if (typeof result === "number") {
        setBalance(result);
      } else if (result && typeof result === "object" && "error" in result) {
        console.error("Error fetching balance:", result.error);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const result = await getTransactions(1, 50);
      if (result && !("error" in result)) {
        setTransactions(result.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const validateCustomAmount = (value: string): string => {
    if (!value || value.trim() === "") {
      return "";
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      return "Please enter a valid number";
    }

    if (numValue % 1 !== 0) {
      return "Amount must be a whole number (no decimals)";
    }

    if (numValue < 1) {
      return "Minimum amount is $1";
    }

    if (numValue > 500) {
      return "Maximum amount is $500";
    }

    return "";
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    setCustomAmountError(validateCustomAmount(value));
  };

  const handleTopUp = async (amount: number | string) => {
    let topUpAmount: number;

    if (typeof amount === "string") {
      const numValue = parseFloat(amount);
      if (isNaN(numValue)) {
        setCustomAmountError("Please enter a valid number");
        return;
      }

      const error = validateCustomAmount(amount);
      if (error) {
        setCustomAmountError(error);
        return;
      }

      topUpAmount = numValue;
    } else {
      topUpAmount = amount;
    }

    // Validate amount
    if (topUpAmount < 1 || topUpAmount > 500) {
      setCustomAmountError("Amount must be between $1 and $500");
      return;
    }

    if (topUpAmount % 1 !== 0) {
      setCustomAmountError("Amount must be a whole number (no decimals)");
      return;
    }

    try {
      setProcessing(true);

      // Create payment order
      const orderResult = await createPaymentOrder(topUpAmount);
      if ("error" in orderResult) {
        setModalMessage(`Error: ${orderResult.error}`);
        onErrorModalOpen();
        setProcessing(false);
        return;
      }

      const { orderId, amount: orderAmount, currency } = orderResult;

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        setModalMessage(
          "Payment gateway is not loaded. Please refresh the page."
        );
        onErrorModalOpen();
        setProcessing(false);
        return;
      }

      // Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderAmount * 100, // Convert to cents
        currency: currency || "USD",
        name: "OnlyJobs",
        description: `Wallet top-up - $${topUpAmount}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResult = await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if ("error" in verifyResult) {
              setModalMessage(
                `Payment verification failed: ${verifyResult.error}`
              );
              onErrorModalOpen();
            } else {
              // Refresh balance and transactions
              await fetchBalance();
              await fetchTransactions();
              setCustomAmount("");
              setModalMessage(
                "Payment successful! Your wallet has been credited."
              );
              onSuccessModalOpen();
            }
          } catch (error) {
            console.error("Error verifying payment:", error);
            setModalMessage("Error verifying payment. Please contact support.");
            onErrorModalOpen();
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#3182CE",
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        setModalMessage(`Payment failed: ${response.error.description}`);
        onErrorModalOpen();
        setProcessing(false);
      });
      razorpay.open();
    } catch (error) {
      console.error("Error processing payment:", error);
      setModalMessage("An error occurred. Please try again.");
      onErrorModalOpen();
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleReportIssue = () => {
    const subject = encodeURIComponent("Wallet Issue - OnlyJobs");
    const body = encodeURIComponent(
      `Please describe your issue:\n\nWallet Balance: $${balance.toFixed(
        2
      )}\n\n`
    );
    window.location.href = `mailto:contact@auroradesignshq.com?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <Head>
        <title>Wallet | OnlyJobs</title>
      </Head>
      <DashboardLayout>
        <Guide
        pageId={walletGuideConfig.pageId}
        steps={walletGuideConfig.steps}
        showModal={walletGuideConfig.showModal}
        modalTitle={walletGuideConfig.modalTitle}
        modalContent={walletGuideConfig.modalContent}
      />
      <VStack spacing={6} align="stretch">
        {/* Balance Card */}
        <Card bg={cardBg} shadow="md" data-guide="wallet-balance">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xl">Wallet Balance</StatLabel>
              {loading ? (
                <Spinner size="lg" />
              ) : (
                <StatNumber fontSize="4xl" color={highlightColor}>
                  ${balance.toFixed(2)}
                </StatNumber>
              )}
            </Stat>
          </CardBody>
        </Card>

        {/* Top-Up Section */}
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Heading as="h2" size="md" mb={4}>
              Top Up Your Wallet
            </Heading>

            <VStack spacing={4} align="stretch">
              <HStack spacing={4} data-guide="top-up-button">
                <Button
                  colorScheme="blue"
                  onClick={() => handleTopUp(5)}
                  flexGrow={1}
                  isLoading={processing}
                  isDisabled={processing}
                >
                  $5
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={() => handleTopUp(10)}
                  flexGrow={1}
                  isLoading={processing}
                  isDisabled={processing}
                >
                  $10
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={() => handleTopUp(20)}
                  flexGrow={1}
                  isLoading={processing}
                  isDisabled={processing}
                >
                  $20
                </Button>
              </HStack>

              <Box>
                <HStack>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FaDollarSign color="gray.300" />
                    </InputLeftElement>
                    <Input
                      type="number"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      isInvalid={!!customAmountError}
                      isDisabled={processing}
                    />
                  </InputGroup>
                  <Button
                    colorScheme="blue"
                    onClick={() => handleTopUp(customAmount)}
                    isDisabled={
                      !customAmount || !!customAmountError || processing
                    }
                    isLoading={processing}
                  >
                    Top Up
                  </Button>
                </HStack>
                {customAmountError && (
                  <FormErrorMessage mt={2}>
                    {customAmountError}
                  </FormErrorMessage>
                )}
                {!customAmountError && customAmount && (
                  <Text fontSize="sm" color={textColor} mt={2}>
                    Enter an amount between $1 and $500 (whole numbers only)
                  </Text>
                )}
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Explanation Text */}
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Heading as="h2" size="md" mb={4}>
              How Charges Work
            </Heading>
            <Text color={textColor}>
              You are charged <strong>$0.30 per day</strong> only if at least
              one job match is found based on your preferred match score
              threshold. There are no charges on days with no matches. This
              ensures you only pay when you receive value from our service.
            </Text>
          </CardBody>
        </Card>

        {/* Transaction History */}
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Heading as="h2" size="md" mb={4}>
              Transaction History
            </Heading>
            <TableContainer data-guide="transactions-table">
              {transactionsLoading ? (
                <Box textAlign="center" py={8}>
                  <Spinner size="lg" />
                </Box>
              ) : transactions.length === 0 ? (
                <Text color={textColor} textAlign="center" py={8}>
                  No transactions yet
                </Text>
              ) : (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Type</Th>
                      <Th>Description</Th>
                      <Th isNumeric>Amount</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {transactions.map((transaction) => (
                      <Tr key={transaction._id}>
                        <Td>{formatDate(transaction.timestamp)}</Td>
                        <Td>
                          <Text
                            color={
                              transaction.type === "credit"
                                ? "green.500"
                                : "red.500"
                            }
                            fontWeight="bold"
                          >
                            {transaction.type === "credit" ? "Credit" : "Debit"}
                          </Text>
                        </Td>
                        <Td>{transaction.description}</Td>
                        <Td isNumeric>
                          {transaction.type === "credit" ? "+" : "-"}$
                          {transaction.amount.toFixed(2)}
                        </Td>
                        <Td>
                          <Text
                            color={
                              transaction.status === "completed"
                                ? "green.500"
                                : transaction.status === "failed"
                                ? "red.500"
                                : "yellow.500"
                            }
                            fontSize="sm"
                          >
                            {transaction.status}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </TableContainer>
          </CardBody>
        </Card>

        {/* Report Issue */}
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading as="h2" size="md">
                Need Help?
              </Heading>
              <Text color={textColor}>
                If you have any issues with your wallet or transactions, please
                report them to us.
              </Text>
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={handleReportIssue}
              >
                Report an Issue
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      {/* Success Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={onSuccessModalClose}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Success</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} py={4}>
              <Icon as={FaCheckCircle} color="green.500" boxSize={12} />
              <Text fontSize="lg" textAlign="center">
                {modalMessage}
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" onClick={onSuccessModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Error Modal */}
      <Modal isOpen={isErrorModalOpen} onClose={onErrorModalClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="red.500">Error</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} py={4}>
              <Icon as={FaExclamationCircle} color="red.500" boxSize={12} />
              <Text fontSize="lg" textAlign="center">
                {modalMessage}
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" onClick={onErrorModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </DashboardLayout>
    </>
  );
};

export default WalletPage;
