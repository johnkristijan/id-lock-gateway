require('dotenv').config()
require('log-timestamp')
const express = require('express')
const app = express()

const port = process.env.NODE_PORT
const BASE = process.env.GATEWAY_BASE || 'https://'
const HOST = process.env.GATEWAY_HOST || '192.168.0.250'

app.get('/', (req, res) => {
    res.send('Server running.')
})

function isValidSixDigitPin(pin) {
    // javascript special case
    if (pin == '000000') {
        return true
    }

    if (!pin) {
        return false
    }

    if (pin.length !== 6) {
        return false
    }

    if(/[0-9]{6,6}/.test(pin)) {
        return true
    }

    return false
}

app.post('/changepin/:leieobjekt/:six_digit_pin', async (req, res) => {
    const leieobjekt = req.params.leieobjekt
    const six_digit_pin = req.params.six_digit_pin
    console.info(`>>> pin change request received; leieobjekt=${leieobjekt} | pin=${six_digit_pin}`)

    if (!leieobjekt) {
        console.info(`>>> leieobjekt missing`)
        res.status(400).send('leieobjekt missing')
        return
    }

    if (!isValidSixDigitPin(six_digit_pin)) {
        console.info(`>>> six_digit_pin not valid`)
        res.status(400).send('six_digit_pin not valid')
        return
    }

    let door_lock_id = undefined
    if (leieobjekt === 'festsal' || leieobjekt === 'selskapslokale') {
        door_lock_id = 'ID_LOCK_0'
    } else if (leieobjekt === 'hybel1') {
        door_lock_id = 'ID_LOCK_1'
    } else if (leieobjekt === 'hybel2') {
        door_lock_id = 'ID_LOCK_2'
    } else {
        console.info(`>>> door_lock_id undefined`)
        res.status(400).send('door_lock_id undefined')
        return
    }

    if (door_lock_id === 'ID_LOCK_0') {
        const URL = `${BASE}${HOST}/set/1/${six_digit_pin}`
        const RESPONSE = await fetch(URL)
        if (RESPONSE && RESPONSE.ok && RESPONSE.status == '200') {
            console.info(`>>> pin change request successful; leieobjekt=${leieobjekt} | pin=${six_digit_pin}`)
            res.send('OK')
        } else {
            console.info(`>>> pin change request failed; leieobjekt=${leieobjekt} | pin=${six_digit_pin}`)
            res.status(400).send('Not OK')
        }
        return
    } else {
        console.info(`>>> door_lock_id ${door_lock_id} is not supported yet`)
        res.status(400).send(`>>> door_lock_id ${door_lock_id} is not supported yet`)
        return
    }
})

app.listen(port, () => {
    console.log(`lock gateway app running on port ${port}`)
})
