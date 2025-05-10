import React, { useState } from "react";
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
  CloseButton,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import { FaDollarSign } from "react-icons/fa";

import DashboardLayout from "../components/Layout/DashboardLayout";

const WalletPage = () => {
  const [balance] = useState(3.2);
  const [customAmount, setCustomAmount] = useState("");
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const [isInTrial] = useState(true);

  const cardBg = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const highlightColor = useColorModeValue("blue.500", "blue.300");

  // Mock transaction history
  const transactions = [
    { date: "May 11, 2023", matches: 2, amount: 0.3 },
    { date: "May 10, 2023", matches: 0, amount: 0.0 },
    { date: "May 9, 2023", matches: 3, amount: 0.3 },
    { date: "May 8, 2023", matches: 1, amount: 0.3 },
    { date: "May 7, 2023", matches: 0, amount: 0.0 },
  ];

  const handleTopUp = (amount: number | string) => {
    console.log(`Topping up $${amount}`);
    // In a real app, this would call an API endpoint
  };

  return (
    <DashboardLayout>
      <VStack spacing={6} align="stretch">
        {isInTrial && showTrialBanner && (
          <Alert status="info" variant="solid" borderRadius="md">
            <AlertIcon />
            <AlertTitle mr={2}>Free Trial Active</AlertTitle>
            <AlertDescription>
              You&apos;re in a free trial. Paid matches will begin on May 14.
            </AlertDescription>
            <CloseButton
              position="absolute"
              right="8px"
              top="8px"
              onClick={() => setShowTrialBanner(false)}
            />
          </Alert>
        )}

        {/* Balance Card */}
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xl">Wallet Balance</StatLabel>
              <StatNumber fontSize="4xl" color={highlightColor}>
                ${balance.toFixed(2)}
              </StatNumber>
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
              <HStack spacing={4}>
                <Button
                  colorScheme="blue"
                  onClick={() => handleTopUp(5)}
                  flexGrow={1}
                >
                  $5
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={() => handleTopUp(10)}
                  flexGrow={1}
                >
                  $10
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={() => handleTopUp(20)}
                  flexGrow={1}
                >
                  $20
                </Button>
              </HStack>

              <HStack>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FaDollarSign color="gray.300" />
                  </InputLeftElement>
                  <Input
                    type="number"
                    placeholder="Custom amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                </InputGroup>
                <Button
                  colorScheme="blue"
                  onClick={() => handleTopUp(customAmount)}
                  isDisabled={!customAmount}
                >
                  Top Up
                </Button>
              </HStack>
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

        {/* Recent Deduction History */}
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Heading as="h2" size="md" mb={4}>
              Recent Deduction History
            </Heading>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th isNumeric>Matches</Th>
                    <Th isNumeric>Charge</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {transactions.map((transaction, index) => (
                    <Tr key={index}>
                      <Td>{transaction.date}</Td>
                      <Td isNumeric>{transaction.matches}</Td>
                      <Td isNumeric>${transaction.amount.toFixed(2)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      </VStack>
    </DashboardLayout>
  );
};

export default WalletPage;
