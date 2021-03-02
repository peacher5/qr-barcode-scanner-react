import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { scanImageData, ImageScanner } from 'zbar.wasm'
import { ZBarConfigType, ZBarSymbolType } from 'zbar.wasm/dist/enum'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: black;
`

const Video = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
`

const StatusText = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  color: white;
`

const ErrorText = styled.div`
  margin-top: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`

const CloseButton = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  margin: 12px;
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 4px 22px 0px rgba(0, 0, 0, 0.2);
  cursor: pointer;
`

export interface ScanResult {
  type: 'qrcode' | 'barcode'
  value: string
}

interface QRScannerOverlayProps {
  onResult: (result: ScanResult) => Promise<void>
  onClose: () => void
}

export const ScannerOverlay = ({ onResult, onClose }: QRScannerOverlayProps) => {
  const [isVideoShowed, setVideoShowed] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const mediaStreamRef = useRef<MediaStream>()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const initMediaStream = async () => {
      try {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'environment',
            width: { max: 1080 },
            height: { max: 1080 }
          }
        })

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStreamRef.current
        }
      } catch (e) {
        setErrorMessage(`${e}`)
      }
    }

    initMediaStream()

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop()
        })
      }
    }
  }, [])

  const initScan = async () => {
    const scanner = await ImageScanner.create()

    scanner.setConfig(ZBarSymbolType.ZBAR_NONE, ZBarConfigType.ZBAR_CFG_ENABLE, 0)
    scanner.setConfig(ZBarSymbolType.ZBAR_QRCODE, ZBarConfigType.ZBAR_CFG_ENABLE, 1)
    scanner.setConfig(ZBarSymbolType.ZBAR_CODE128, ZBarConfigType.ZBAR_CFG_ENABLE, 1)

    const scan: () => Promise<ScanResult | null> = async () => {
      if (!videoRef.current) {
        throw Error()
      }

      const { videoWidth: width, videoHeight: height } = videoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw Error()
      }

      ctx.drawImage(videoRef.current, 0, 0, width, height)

      const image = ctx.getImageData(0, 0, width, height)
      const result = await scanImageData(image, scanner)

      if (result.length) {
        const { type } = result[0]
        const value = result[0].decode()

        if (type === ZBarSymbolType.ZBAR_QRCODE) {
          return { type: 'qrcode', value }
        }

        if (type === ZBarSymbolType.ZBAR_CODE128) {
          return { type: 'barcode', value }
        }
      }

      return null
    }

    try {
      while (true) {
        const result = await scan()

        if (result) {
          await onResult(result)
        }

        await wait(100)
      }
    } catch {}
  }

  const onVideoLoaded = () => {
    setVideoShowed(true)
    initScan()
  }

  let status = ''

  if (errorMessage) {
    status = `ไม่สามารถเปิดกล้องได้`
  } else if (!isVideoShowed) {
    status = 'กำลังเปิดกล้อง...'
  }

  return (
    <Container>
      <Video ref={videoRef} onLoadedData={onVideoLoaded} autoPlay={true} controls={false} playsInline />
      <StatusText>
        {status}
        <ErrorText>{errorMessage}</ErrorText>
      </StatusText>
      <CloseButton onClick={() => onClose()}>X</CloseButton>
    </Container>
  )
}
