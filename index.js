require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.NODE_PORT

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

app.get('/', (req, res) => {
    res.send('Server running.')
})

app.post('/changepin/:leieobjekt/:six_digit_pin', async (req, res) => {
    const leieobjekt = req.params.leieobjekt
    const six_digit_pin = req.params.six_digit_pin
    if (!leieobjekt) {
        res.send('leieobjekt missing')
        return
    }
    if (!six_digit_pin) {
        res.send('six_digit_pin missing')
        return
    }

    // validate the pin!

    let door_lock_id = undefined
    if (leieobjekt === 'festsal' || leieobjekt === 'selskapslokale') {
        door_lock_id = 'ID_LOCK_0'
    } else if (leieobjekt === 'hybel1') {
        door_lock_id = 'ID_LOCK_1'
    } else if (leieobjekt === 'hybel2') {
        door_lock_id = 'ID_LOCK_2'
    } else {
        res.send('leieobjekt undefined')
        return
    }

    const BASE = process.env.GATEWAY_BASE || 'https://'
    const HOST = process.env.GATEWAY_HOST || '192.168.0.250'
    let url = `${BASE}${HOST}/set_pin/user/1/pin/${six_digit_pin}`
    const options = {}
    const response = await fetch(url, options)
    if (response && response.ok) {
        await sleep(5000)
        url = `${BASE}${HOST}/get_pin/user/1`
        const verification = await fetch(url, options) // duration ~5 seconds
        if (verification && verification.ok) {
            try {
                const verifiedPin = await verification.json()
                if (six_digit_pin == verifiedPin) {
                    res.send('OK: PIN changed - lock has confirmed new PIN: ' + six_digit_pin)
                    return
                } else {
                    console.log('six_digit_pin :>> ', six_digit_pin)
                    console.info(typeof six_digit_pin)
                    console.log('verifiedPin :>> ', verifiedPin)
                    console.info(typeof verifiedPin)
                    res.status(400).send(`Could not verify new pin from lock ${door_lock_id}`)
                    return
                }
            } catch (err) {
                res.status(400).send(
                    `Verification failed - user error on lock ${door_lock_id} due to ${err.message}`
                )
                return
            }
        } else {
            res.status(400).send(`Unsuccessful verification from lock ${door_lock_id}`)
        }
    } else {
        res.status(400).send(`Unsuccessful response from lock ${door_lock_id}`)
        return
    }

    res.send('changepin OK')
})

app.listen(port, () => {
    console.log(`gateway receiver app running on port ${port}`)
})
