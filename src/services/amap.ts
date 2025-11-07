import { config } from '../config/env'
import type { Location } from '../types'

// 高德地图API配置
const AMAP_KEY = config.amap.key

// 加载高德地图脚本
export const loadAmapScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('加载高德地图失败'))
    document.head.appendChild(script)
  })
}

// 地理编码 - 地址转坐标
export const geocode = async (address: string): Promise<{ lng: number; lat: number } | null> => {
  try {
    const response = await fetch(
      `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_KEY}&address=${encodeURIComponent(address)}`
    )
    const data = await response.json()

    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      const [lng, lat] = data.geocodes[0].location.split(',')
      return { lng: parseFloat(lng), lat: parseFloat(lat) }
    }

    return null
  } catch (error) {
    console.error('地理编码失败:', error)
    return null
  }
}

// 逆地理编码 - 坐标转地址
export const regeocode = async (lng: number, lat: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${lng},${lat}`
    )
    const data = await response.json()

    if (data.status === '1' && data.regeocode) {
      return data.regeocode.formatted_address
    }

    return null
  } catch (error) {
    console.error('逆地理编码失败:', error)
    return null
  }
}

// POI搜索
export const searchPOI = async (
  keywords: string,
  city?: string
): Promise<any[]> => {
  try {
    let url = `https://restapi.amap.com/v3/place/text?key=${AMAP_KEY}&keywords=${encodeURIComponent(keywords)}`
    if (city) {
      url += `&city=${encodeURIComponent(city)}`
    }

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === '1' && data.pois) {
      return data.pois.map((poi: any) => ({
        id: poi.id,
        name: poi.name,
        address: poi.address,
        location: {
          lng: parseFloat(poi.location.split(',')[0]),
          lat: parseFloat(poi.location.split(',')[1]),
        },
        type: poi.type,
        tel: poi.tel,
      }))
    }

    return []
  } catch (error) {
    console.error('POI搜索失败:', error)
    return []
  }
}

// 路线规划 - 驾车
export const getDrivingRoute = async (
  origin: { lng: number; lat: number },
  destination: { lng: number; lat: number }
): Promise<any> => {
  try {
    const response = await fetch(
      `https://restapi.amap.com/v3/direction/driving?key=${AMAP_KEY}&origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}`
    )
    const data = await response.json()

    if (data.status === '1' && data.route && data.route.paths && data.route.paths.length > 0) {
      const path = data.route.paths[0]
      return {
        distance: path.distance, // 米
        duration: path.duration, // 秒
        strategy: path.strategy,
        steps: path.steps,
      }
    }

    return null
  } catch (error) {
    console.error('路线规划失败:', error)
    return null
  }
}

// 路线规划 - 公交
export const getTransitRoute = async (
  origin: { lng: number; lat: number },
  destination: { lng: number; lat: number },
  city: string
): Promise<any> => {
  try {
    const response = await fetch(
      `https://restapi.amap.com/v3/direction/transit/integrated?key=${AMAP_KEY}&origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}&city=${encodeURIComponent(city)}`
    )
    const data = await response.json()

    if (data.status === '1' && data.route && data.route.transits && data.route.transits.length > 0) {
      return data.route.transits.map((transit: any) => ({
        duration: transit.duration,
        distance: transit.distance,
        cost: transit.cost,
        segments: transit.segments,
      }))
    }

    return []
  } catch (error) {
    console.error('公交路线规划失败:', error)
    return []
  }
}

// 步行路线规划
export const getWalkingRoute = async (
  origin: { lng: number; lat: number },
  destination: { lng: number; lat: number }
): Promise<any> => {
  try {
    const response = await fetch(
      `https://restapi.amap.com/v3/direction/walking?key=${AMAP_KEY}&origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}`
    )
    const data = await response.json()

    if (data.status === '1' && data.route && data.route.paths && data.route.paths.length > 0) {
      const path = data.route.paths[0]
      return {
        distance: path.distance,
        duration: path.duration,
        steps: path.steps,
      }
    }

    return null
  } catch (error) {
    console.error('步行路线规划失败:', error)
    return null
  }
}

// 全局类型声明
declare global {
  interface Window {
    AMap: any
  }
}
