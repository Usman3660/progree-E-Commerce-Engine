import React, { createContext, useContext, useState, useEffect } from 'react';

const SandboxContext = createContext();

export function SandboxProvider({ children }) {
  const [latencyMs, setLatencyMs] = useState(600);
  const [simulationMode, setSimulationMode] = useState('auto'); // 'auto', 'success', '3ds', 'decline', 'insufficient_funds', 'fraud'
  const [testCards, setTestCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'transactions', 'audit_logs', 'metrics'
  const [telemetry, setTelemetry] = useState(null);

  // Fetch sandbox test cards on mount
  useEffect(() => {
    async function loadTestCards() {
      try {
        const res = await fetch('/api/checkout/sandbox-cards');
        if (res.ok) {
          const data = await res.json();
          setTestCards(data.cards || []);
          if (data.cards && data.cards.length > 0) {
            setSelectedCard(data.cards[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load sandbox cards:', err);
      }
    }
    loadTestCards();
  }, []);

  // Fetch telemetry & metrics
  const refreshTelemetry = async () => {
    try {
      const res = await fetch('/api/admin/metrics');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    }
  };

  useEffect(() => {
    refreshTelemetry();
  }, []);

  const selectTestCard = (card) => {
    setSelectedCard(card);
    if (card.cardNumber.endsWith('0002')) setSimulationMode('3ds');
    else if (card.cardNumber.endsWith('0069')) setSimulationMode('decline');
    else if (card.cardNumber.endsWith('0127')) setSimulationMode('insufficient_funds');
    else if (card.cardNumber.endsWith('0005')) setSimulationMode('fraud');
    else setSimulationMode('auto');
  };

  return (
    <SandboxContext.Provider value={{
      latencyMs,
      setLatencyMs,
      simulationMode,
      setSimulationMode,
      testCards,
      selectedCard,
      selectTestCard,
      isConsoleOpen,
      setIsConsoleOpen,
      activeTab,
      setActiveTab,
      telemetry,
      refreshTelemetry
    }}>
      {children}
    </SandboxContext.Provider>
  );
}

export function useSandbox() {
  return useContext(SandboxContext);
}
