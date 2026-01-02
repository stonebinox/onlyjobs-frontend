import React, { useState, useEffect, useCallback } from "react";
import Joyride, {
  CallBackProps,
  Step,
  STATUS,
  EVENTS,
  ACTIONS,
} from "react-joyride";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  HStack,
  useColorModeValue,
  Box,
  useTheme,
} from "@chakra-ui/react";
import { useGuide } from "@/contexts/GuideContext";

interface GuideProps {
  pageId: string;
  steps: Step[];
  showModal?: boolean;
  modalTitle?: string;
  modalContent?: React.ReactNode;
  onComplete?: () => void;
  onSkip?: () => void;
  run?: boolean;
}

const Guide: React.FC<GuideProps> = ({
  pageId,
  steps,
  showModal = false,
  modalTitle = "Welcome!",
  modalContent,
  onComplete,
  onSkip,
  run: controlledRun,
}) => {
  const { isPageGuideCompleted, isPageGuideSkipped, updatePageProgress, isLoading } =
    useGuide();
  const [run, setRun] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [activeSteps, setActiveSteps] = useState<Step[]>([]);
  const theme = useTheme();

  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");

  // Get theme colors for buttons
  const primaryColor = theme.colors.brand[800];
  const primaryHoverColor = theme.colors.brand[900];
  const skipColor = theme.colors.gray[500];

  // Only render on client side to avoid hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent clicks on spotlighted elements from closing the guide
  useEffect(() => {
    if (!run || !mounted) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if click is on the react-joyride overlay (the dark backdrop)
      const overlay = target.closest('[class*="__overlay"]');
      if (overlay) {
        // Check if click is on the close button specifically
        const closeButton = target.closest(
          'button[aria-label*="close" i], button[aria-label*="Close" i], button[title*="close" i]'
        );
        if (!closeButton) {
          // This is a click on the overlay but not the close button - prevent it
          e.stopPropagation();
          e.preventDefault();
          return false;
        }
      }

      // Check if click is on a spotlighted element (the highlighted element itself)
      // react-joyride adds a spotlight wrapper around the target element
      const spotlightWrapper = target.closest('[class*="__spotlight"]');
      if (spotlightWrapper) {
        // This is a click on the spotlighted element - prevent it from closing
        e.stopPropagation();
        e.preventDefault();
        return false;
      }
    };

    // Use capture phase to intercept before react-joyride handles it
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [run, mounted]);

  useEffect(() => {
    // Only run checks after component is mounted on client and guide progress is loaded
    if (!mounted || hasStarted || isLoading) return;

    // Check if guide should run
    const shouldRun =
      controlledRun !== undefined
        ? controlledRun
        : !isPageGuideCompleted(pageId) && !isPageGuideSkipped(pageId);

    if (shouldRun) {
      if (showModal) {
        setShowWelcomeModal(true);
      } else {
        // Filter steps and start immediately (no modal)
        const visibleSteps = steps
          .filter((step) => {
            if (typeof step.target === "string") {
              const element = document.querySelector(step.target);
              return element !== null;
            }
            return true;
          })
          .map((step) => ({
            ...step,
            disableBeacon: true,
            spotlightClicks: false,
          }));
        setActiveSteps(visibleSteps);
        setStepIndex(0);
        setRun(true);
        setHasStarted(true);
      }
    }
  }, [
    pageId,
    isPageGuideCompleted,
    isPageGuideSkipped,
    showModal,
    controlledRun,
    mounted,
    hasStarted,
    steps,
    isLoading,
  ]);

  const handleJoyrideCallback = useCallback(
    async (data: CallBackProps) => {
      const { status, type, action, index } = data;

      // Handle close action (clicking X button in tooltip)
      // With spotlightClicks: false and click interceptor, clicks on spotlighted elements should be prevented
      if (action === ACTIONS.CLOSE) {
        setRun(false);
        try {
          await updatePageProgress(pageId, false, true);
        } catch (error) {
          console.error("Failed to update guide progress:", error);
        }
        if (onSkip) {
          onSkip();
        }
        return;
      }

      // Handle skip action
      if (action === ACTIONS.SKIP) {
        setRun(false);
        try {
          await updatePageProgress(pageId, false, true);
        } catch (error) {
          console.error("Failed to update guide progress:", error);
        }
        if (onSkip) {
          onSkip();
        }
        return;
      }

      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        setRun(false);
        const completed = status === STATUS.FINISHED;
        const skipped = status === STATUS.SKIPPED;

        // Update progress via context (which handles API call)
        try {
          await updatePageProgress(pageId, completed, skipped);
        } catch (error) {
          console.error("Failed to update guide progress:", error);
        }

        if (completed && onComplete) {
          onComplete();
        } else if (skipped && onSkip) {
          onSkip();
        }
      } else if (type === EVENTS.TARGET_NOT_FOUND) {
        // Skip to next step if target not found
        setStepIndex(index + 1);
      } else if (type === EVENTS.STEP_AFTER) {
        // Update step index after completing a step
        if (action === ACTIONS.NEXT) {
          setStepIndex(index + 1);
        } else if (action === ACTIONS.PREV) {
          setStepIndex(index - 1);
        }
      }
    },
    [pageId, onComplete, onSkip, updatePageProgress]
  );

  // Filter steps to only include those with visible targets
  const getVisibleSteps = useCallback(() => {
    return steps
      .filter((step) => {
        if (typeof step.target === "string") {
          const element = document.querySelector(step.target);
          return element !== null;
        }
        return true;
      })
      .map((step) => ({
        ...step,
        disableBeacon: true,
        disableOverlayClose: false,
        spotlightClicks: false,
      }));
  }, [steps]);

  const handleStartGuide = () => {
    // Filter steps at the moment the guide starts
    const visibleSteps = getVisibleSteps();
    setActiveSteps(visibleSteps);
    setStepIndex(0);
    setShowWelcomeModal(false);
    setRun(true);
    setHasStarted(true);
  };

  const handleSkipGuide = async () => {
    setShowWelcomeModal(false);
    setHasStarted(true);
    try {
      await updatePageProgress(pageId, false, true);
    } catch (error) {
      console.error("Failed to skip guide:", error);
    }
    if (onSkip) {
      onSkip();
    }
  };

  // Don't render anything during SSR
  if (!mounted) {
    return null;
  }

  return (
    <>
      <Joyride
        steps={activeSteps}
        run={run}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        stepIndex={stepIndex}
        styles={{
          options: {
            primaryColor: primaryColor,
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 8,
          },
          tooltipContainer: {
            textAlign: "left",
          },
          buttonNext: {
            backgroundColor: primaryColor,
            color: "white",
            fontSize: "14px",
            fontWeight: 500,
            padding: "8px 16px",
            borderRadius: "6px",
          },
          buttonBack: {
            color: primaryColor,
            fontSize: "14px",
            marginRight: "8px",
          },
          buttonSkip: {
            color: skipColor,
            fontSize: "14px",
          },
        }}
        locale={{
          back: "Previous",
          close: "Close",
          last: "Finish",
          next: "Next",
          skip: "Skip",
        }}
        floaterProps={{
          disableAnimation: false,
        }}
        disableScrollParentFix
        disableOverlayClose
      />

      {showWelcomeModal && (
        <Modal isOpen={showWelcomeModal} onClose={handleSkipGuide} size="md">
          <ModalOverlay />
          <ModalContent bg={bgColor} color={textColor}>
            <ModalHeader>{modalTitle}</ModalHeader>
            <ModalBody>
              {modalContent || (
                <Text>
                  Let&apos;s take a quick tour to help you get started with this
                  page!
                </Text>
              )}
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={handleSkipGuide}>
                  Skip
                </Button>
                <Button onClick={handleStartGuide}>Start Guide</Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default Guide;
