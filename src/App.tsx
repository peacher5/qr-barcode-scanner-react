import { useState } from 'react'
import styled from 'styled-components'

import { ScannerOverlay, ScanResult } from './ScannerOverlay'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24px;
`

const ResultSection = styled.pre`
  flex-grow: 1;
  background: rgba(0, 0, 0, 0.1);
  padding: 12px;
  margin: 0;
  margin-bottom: 20px;
  font-size: 14px;
  overflow: scroll;
`

const ScanButton = styled.div`
  background: #4a4a73;
  padding: 20px;
  text-align: center;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
`

export const App = () => {
  const [resultText, setResultText] = useState('-')
  const [showScanner, setShowScanner] = useState(false)

  const onScanResult = async (result: ScanResult) => {
    setShowScanner(false)
    setResultText(JSON.stringify(result, null, 2))
  }

  return (
    <Container>
      <ResultSection>{resultText}</ResultSection>
      <ScanButton onClick={() => setShowScanner(true)}>Scan</ScanButton>
      {showScanner && <ScannerOverlay onResult={onScanResult} onClose={() => setShowScanner(false)} />}
    </Container>
  )
}
