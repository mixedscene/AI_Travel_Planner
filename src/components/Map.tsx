import React, { useEffect, useRef, useState } from 'react'
import { message } from 'antd'
import { loadAmapScript } from '../services/amap'
import type { Location } from '../types'

interface MapProps {
  center?: { lng: number; lat: number }
  zoom?: number
  markers?: Array<{
    position: { lng: number; lat: number }
    title: string
    content?: string
  }>
  style?: React.CSSProperties
}

const Map: React.FC<MapProps> = ({
  center = { lng: 116.397428, lat: 39.90923 }, // 默认北京
  zoom = 13,
  markers = [],
  style = { width: '100%', height: '400px' },
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    initMap()
    return () => {
      // 清理地图
      if (map) {
        map.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (map) {
      // 更新中心点
      map.setCenter([center.lng, center.lat])
      map.setZoom(zoom)
    }
  }, [map, center, zoom])

  useEffect(() => {
    if (map) {
      updateMarkers()
    }
  }, [map, markers])

  const initMap = async () => {
    try {
      await loadAmapScript()

      if (!mapRef.current) return

      const mapInstance = new window.AMap.Map(mapRef.current, {
        zoom,
        center: [center.lng, center.lat],
        viewMode: '3D',
        pitch: 50,
        showIndoorMap: false,
      })

      setMap(mapInstance)
    } catch (error) {
      message.error('地图加载失败')
      console.error(error)
    }
  }

  const updateMarkers = () => {
    // 清除旧标记
    markersRef.current.forEach(marker => {
      map.remove(marker)
    })
    markersRef.current = []

    // 添加新标记
    markers.forEach((markerData) => {
      // 检查位置数据是否有效
      if (!markerData.position || !markerData.position.lng || !markerData.position.lat) {
        console.warn('Invalid marker position:', markerData)
        return
      }

      const marker = new window.AMap.Marker({
        position: [markerData.position.lng, markerData.position.lat],
        title: markerData.title,
        map: map,
      })

      if (markerData.content) {
        const infoWindow = new window.AMap.InfoWindow({
          content: `<div style="padding: 10px;">
            <h4>${markerData.title}</h4>
            <p>${markerData.content}</p>
          </div>`,
        })

        marker.on('click', () => {
          infoWindow.open(map, marker.getPosition())
        })
      }

      markersRef.current.push(marker)
    })

    // 自动调整视野以包含所有标记
    if (markers.length > 0) {
      map.setFitView()
    }
  }

  return <div ref={mapRef} style={style} />
}

export default Map
