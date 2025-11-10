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
  path?: Array<{ lng: number; lat: number }>
  style?: React.CSSProperties
}

const Map: React.FC<MapProps> = ({
  center = { lng: 116.397428, lat: 39.90923 }, // 默认北京
  zoom = 13,
  markers = [],
  path = [],
  style = { width: '100%', height: '400px' },
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const markersRef = useRef<any[]>([])
  const polylineRef = useRef<any | null>(null)

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
      try {
        // 更新中心点
        map.setCenter([center.lng, center.lat])
        map.setZoom(zoom)
      } catch (error) {
        console.error('Failed to update map center/zoom:', error)
      }
    }
  }, [map, center, zoom])

  useEffect(() => {
    if (map) {
      updateMarkers()
    }
  }, [map, markers])

  useEffect(() => {
    if (map) {
      updatePath()
    }
  }, [map, path])

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
    if (!map) return
    
    // 清除旧标记
    markersRef.current.forEach(marker => {
      try {
        map.remove(marker)
      } catch (e) {
        console.warn('Failed to remove marker:', e)
      }
    })
    markersRef.current = []

    // 添加新标记（带序号）
    markers.forEach((markerData, index) => {
      // 检查位置数据是否有效
      if (!markerData.position || !markerData.position.lng || !markerData.position.lat) {
        console.warn('Invalid marker position:', markerData)
        return
      }

      try {
        // 创建带序号的自定义标记
        const marker = new window.AMap.Marker({
          position: [markerData.position.lng, markerData.position.lat],
          title: markerData.title,
          map: map,
          content: `<div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">${index + 1}</div>`,
          offset: new window.AMap.Pixel(-16, -16),
        })

        if (markerData.content) {
          const infoWindow = new window.AMap.InfoWindow({
            content: `<div style="padding: 12px; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #667eea; font-size: 16px;">
                📍 景点 ${index + 1}: ${markerData.title}
              </h4>
              <p style="margin: 0; color: #666; line-height: 1.5;">${markerData.content}</p>
            </div>`,
          })

          marker.on('click', () => {
            infoWindow.open(map, marker.getPosition())
          })
        }

        markersRef.current.push(marker)
      } catch (error) {
        console.error('Failed to create marker:', error)
      }
    })

    // 自动调整视野以包含所有标记
    if (markers.length > 0 && map) {
      try {
        setTimeout(() => {
          map.setFitView()
        }, 100)
      } catch (error) {
        console.error('Failed to fit view:', error)
      }
    }
  }

  const updatePath = () => {
    if (!map) return
    
    // 清除旧路径
    if (polylineRef.current) {
      try {
        map.remove(polylineRef.current)
      } catch (e) {
        console.warn('Failed to remove polyline:', e)
      }
      polylineRef.current = null
    }

    if (!path || path.length < 2) return

    try {
      // 创建带箭头的路径线
      const line = new window.AMap.Polyline({
        path: path.map(p => [p.lng, p.lat]),
        isOutline: true,
        outlineColor: '#ffffff',
        borderWeight: 3,
        strokeColor: '#667eea',
        strokeOpacity: 0.8,
        strokeWeight: 6,
        strokeStyle: 'solid',
        lineJoin: 'round',
        lineCap: 'round',
        zIndex: 50,
        showDir: true, // 显示方向箭头
      })

      map.add(line)
      polylineRef.current = line

      // 添加起点和终点文字标记
      if (path.length >= 2) {
        const startMarker = new window.AMap.Text({
          text: '起点',
          position: [path[0].lng, path[0].lat],
          style: {
            'background-color': '#4CAF50',
            'border': '2px solid white',
            'border-radius': '4px',
            'color': 'white',
            'font-size': '12px',
            'padding': '4px 8px',
            'box-shadow': '0 2px 6px rgba(0,0,0,0.3)',
          },
          offset: new window.AMap.Pixel(0, -40),
        })
        
        const endMarker = new window.AMap.Text({
          text: '终点',
          position: [path[path.length - 1].lng, path[path.length - 1].lat],
          style: {
            'background-color': '#f44336',
            'border': '2px solid white',
            'border-radius': '4px',
            'color': 'white',
            'font-size': '12px',
            'padding': '4px 8px',
            'box-shadow': '0 2px 6px rgba(0,0,0,0.3)',
          },
          offset: new window.AMap.Pixel(0, -40),
        })

        map.add([startMarker, endMarker])
        markersRef.current.push(startMarker, endMarker)
      }

      // 视野适配 - 延迟执行以确保地图已完全加载
      setTimeout(() => {
        try {
          if (map && line) {
            map.setFitView([line])
          }
        } catch (error) {
          console.error('Failed to fit view:', error)
        }
      }, 100)
    } catch (error) {
      console.error('Failed to create path:', error)
    }
  }

  return <div ref={mapRef} style={style} />
}

export default Map
