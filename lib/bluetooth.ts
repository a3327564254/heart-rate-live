import type { HeartRateData } from "./types";

// 标准心率服务 UUID
const HEART_RATE_SERVICE_UUID = "0000180d-0000-1000-8000-00805f9b34fb";
// 心率测量特征 UUID
const HEART_RATE_MEASUREMENT_UUID = "00002a37-0000-1000-8000-00805f9b34fb";

export interface BLEConnection {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  characteristic: BluetoothRemoteGATTCharacteristic;
  disconnect: () => void;
}

/**
 * 解析心率测量数据
 * 格式参考: https://www.bluetooth.com/specifications/specs/heart-rate-service-1-0/
 */
function parseHeartRateData(value: DataView): HeartRateData {
  const flags = value.getUint8(0);
  const isUINT16 = (flags & 0x01) !== 0;
  const contactDetected = (flags & 0x06) === 0x06;
  const hasEnergyExpended = (flags & 0x08) !== 0;
  const hasRRIntervals = (flags & 0x10) !== 0;

  let offset = 1;
  let bpm: number;

  if (isUINT16) {
    bpm = value.getUint16(offset, true);
    offset += 2;
  } else {
    bpm = value.getUint8(offset);
    offset += 1;
  }

  let energyExpended: number | undefined;
  if (hasEnergyExpended) {
    energyExpended = value.getUint16(offset, true);
    offset += 2;
  }

  const rrIntervals: number[] = [];
  if (hasRRIntervals) {
    while (offset + 2 <= value.byteLength) {
      // RR 间隔单位是 1/1024 秒，转换为毫秒
      const rr = value.getUint16(offset, true) * (1000 / 1024);
      rrIntervals.push(rr);
      offset += 2;
    }
  }

  return { bpm, contactDetected, energyExpended, rrIntervals };
}

/**
 * 连接到心率设备
 */
export async function connectToHeartRateDevice(
  onHeartRate: (data: HeartRateData) => void,
  onDisconnect: () => void
): Promise<BLEConnection> {
  // 检查 Web Bluetooth 支持
  if (!navigator.bluetooth) {
    throw new Error("此浏览器不支持 Web Bluetooth，请使用 Chrome 或 Edge");
  }

  // 请求设备
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [HEART_RATE_SERVICE_UUID] }],
    optionalServices: [HEART_RATE_SERVICE_UUID],
  });

  // 监听断开事件
  device.addEventListener("gattserverdisconnected", onDisconnect);

  // 连接 GATT 服务器
  const server = await device.gatt!.connect();

  // 获取心率服务
  const service = await server.getPrimaryService(HEART_RATE_SERVICE_UUID);

  // 获取心率测量特征
  const characteristic = await service.getCharacteristic(
    HEART_RATE_MEASUREMENT_UUID
  );

  // 订阅心率通知
  await characteristic.startNotifications();

  // 监听心率数据
  characteristic.addEventListener("characteristicvaluechanged", (event) => {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (value) {
      const data = parseHeartRateData(value);
      onHeartRate(data);
    }
  });

  return {
    device,
    server,
    characteristic,
    disconnect: () => {
      characteristic.removeEventListener(
        "characteristicvaluechanged",
        () => {}
      );
      if (server.connected) {
        server.disconnect();
      }
    },
  };
}

/**
 * 检查 Web Bluetooth 是否可用
 */
export function isWebBluetoothAvailable(): boolean {
  return typeof navigator !== "undefined" && !!navigator.bluetooth;
}
