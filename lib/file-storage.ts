import fs from "fs"
import path from "path"

const STORAGE_DIR = path.join(process.cwd(), ".data")

// Ensure storage directory exists
if (typeof window === "undefined") {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true })
  }
}

interface FileStorage {
  [key: string]: any
}

export function readFromFile(filename: string): any {
  try {
    const filePath = path.join(STORAGE_DIR, `${filename}.json`)
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8")
      return JSON.parse(data)
    }
    return null
  } catch (error) {
    console.error(`[v0] Error reading from file ${filename}:`, error)
    return null
  }
}

export function writeToFile(filename: string, data: any): boolean {
  try {
    const filePath = path.join(STORAGE_DIR, `${filename}.json`)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
    return true
  } catch (error) {
    console.error(`[v0] Error writing to file ${filename}:`, error)
    return false
  }
}

export function deleteFromFile(filename: string): boolean {
  try {
    const filePath = path.join(STORAGE_DIR, `${filename}.json`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    return true
  } catch (error) {
    console.error(`[v0] Error deleting file ${filename}:`, error)
    return false
  }
}
