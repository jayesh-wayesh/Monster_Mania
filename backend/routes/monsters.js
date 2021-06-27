const router = require('express').Router();
const Monster = require('../models/monster.model');
const User = require('../models/user.model');
const blockCoApi = require('../blockco/api_calls')

const SECRET_PREFIX=process.env.SECRET_PREFIX
const SECRET_SUFFIX=process.env.SECRET_SUFFIX
const monsterNames = ["Birdy Boss","Casper Spray","Hit Woman","Aqua Coach","Thunder Kid","Mad Sauce","Octo Crush","Shady Stick","Sawft Ball","Hippie Puns","King Cyborg"]
const monsterImages = [
    "https://blush.design/api/download?shareUri=I-RI7TbzIOQP7-rc&c=Skin_0%7Efd8800&w=800&h=800&fm=png",
    "https://blush.design/api/download?shareUri=EbvZIUvQiGIwT82T&c=Skin_0%7E00d2dc&w=800&h=800&fm=png",
    "https://blush.design/api/download?shareUri=MetU3cmttp6SXjsH&c=Skin_0%7Eacff00&w=800&h=800&fm=png",
    "https://blush.design/api/download?shareUri=IzJmjRnWbmhZp4d9&c=Skin_0%7E0099a3&w=800&h=800&fm=png",
    "https://blush.design/api/download?shareUri=1m-Pb5NHc30PevgO&c=Skin_0%7E7c6bba&w=800&h=800&fm=png",
    "https://blush.design/api/download?shareUri=1oZiY75RzrYnDy83&c=Skin_0%7Effcf00&w=800&h=800&fm=png",
    "https://blush.design/api/download?shareUri=rcIg6q5bkeOg4dao&c=Skin_0%7E00d2dc&w=800&h=800&fm=png",
    "https://blush.design/api/download?shareUri=NAmV5SxVJBTSJJ31&c=Skin_0%7Ef45675&w=800&h=800&fm=png",
    "https://blush.design/api/download?shareUri=-yvhHgBFZudAzkzT&c=Skin_0%7Efd8800&w=800&h=800&fm=png",
    "https://blush.design/api/download?shareUri=Nz2iPIPUFwjCjbe3&c=Skin_0%7Ef45675&w=800&h=800&fm=png",
    "https://blush.design/api/download?shareUri=CAXReDx4hsb40oN4&c=Skin_0%7Eacff00&w=800&h=800&fm=png"
]


// Fetch all monsters
router.route('/').get((req, res) => {

    Monster.find()
        .then(monsters => res.json(monsters))
        .catch(err => res.status(400).json('Error: ' + err));
    
})


// NFT Creation 
router.route('/create').post(async (req,res) => {

    /********** NFT Creation api call starts **********/
    /*
    const response = await blockCoApi.createNFTs(
        'testUser5',
        {
            'name': req.body.monsterProperties.name,
            'monster_id': req.body.monsterProperties.monsterID, 
            'editions': req.body.editions,
        }
    )

    if(response.statusCode !== 201){
        return res.json({"Error": response})
    }
    
    const nft_ids = response.body
    return res.json(nft_ids)
    */
    /********** Account Creation api call ends **********/
    
    // Temporary workaround to create NFTs 
    var editions = req.body.editions
    console.log('editions')
    console.log(req.body.editions)
    var newMonstersArray = []

    for(var i = 1; i <= editions; i++) {

        const newMonster = new Monster({
            nft_id: Number(req.body.last_nft_id) + i,  // value added is temporary 
            edition: i,  // value added is temporary 
            media_id: req.body.monsterProperties.monsterID,
            name: monsterNames[ req.body.monsterProperties.monsterID - 1 ],
            content_url: monsterImages[ req.body.monsterProperties.monsterID - 1 ],
        });
        
        //newMonstersArray.push(newMonster)
        await newMonster.save()
            .then(monster => {newMonstersArray.push(monster)})
            .catch(err => res.status(400).json('Error: ' + err))

    }
    
    User.findOne({ account_id: 'dev'})
        .then(user => {
            user.monsters = user.monsters.concat(newMonstersArray)
            console.log(user)

            user.save()
                .then(() => res.status(200).json('NFTs added to developer account '))
                .catch(err => res.status(400).json('Error: ' + err));
        })
})


// NFT Transfer
router.route('/transfer').put(async (req, res) => {

    const media_id = req.body.monsterID
    var monsterToBeTransferred

    // Remove from developer's account
    await User.findOne({account_id: 'dev' })
        .populate('monsters')
        .then(user => {

            var index = user.monsters.findIndex(monster => monster.media_id == media_id)
            monsterToBeTransferred = user.monsters[index]
            user.monsters.splice(index, 1)

            console.log('monsterToBeTransferred')
            console.log(monsterToBeTransferred)

            user.save()
                .then(() => {console.log('monster removed from developer account!')})
                .catch(err => res.status(400).json('Error: ' + err))
        })


    /********** NFT Transfer api call starts **********/
    /*
    var response = await blockCoApi.transferNFT('testUser1', 'testUser2', [6])
    console.log(response)
    if(response.statusCode === 401){
  
      // call refresh token
      response = await refreshToken('testUser1')
      if(response.statusCode !== 201){
        return res.json({"Error": response})
      }
      
      // update JWT
      process.env.testUser1_JWT = response.body.jwt
  
      // again call Transfer NFTs
      response = await blockCoApi.transferNFT('testUser1', 'testUser2', [6])
      if(response.statusCode !== 200){
        return res.json({"Error": response})
      }
  
    }else if(response.statusCode !== 200){
      return res.json({"Error": response})
    }
  
    return res.json(response)
    */
    /********** NFT Transfer api call ends **********/


    // Add to user's account
    await User.findOne({ account_id: req.body.recipient })
        .then(user => {
            user.monsters.push(monsterToBeTransferred)
            console.log('user')
            console.log(user)

            user.save()
                .then(() => {console.log('monster added to user account!')})
                .catch(err => res.status(400).json('Error: ' + err))
        })

    res.status(200).json(monsterToBeTransferred)

});


const refreshToken = async (username) => {
  
    const passcode = SECRET_PREFIX + username + SECRET_SUFFIX
    const response = await blockCoApi.refreshToken(username, passcode)
    return response
}


module.exports = router;