//遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardMatchedFailed: 'CardMatchedFailed',
  CardMatched: 'CardMatched',
  GameFinished: 'GameFinished',
}

//撲克牌花色
const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]

//亂數更換牌組
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

//卡片畫面
const view = {
  //產生牌面圖案(牌背)
  getCardContent(index) {
    const number = this.TransformStream((index % 13) + 1)
    const symbol = Symbols[(Math.floor(index / 13))]
    return `
        <p>${number}</p>
        <img src="${symbol}">
        <p>${number}</p>
    `
  },
  //產生卡牌內容(牌面)
  getCardElement(index) {
    return `<div class="card back" data-index="${index}"></div>`
  },
  //修改11.12.13.1的顯示字母
  TransformStream(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  //取出卡片資料
  displayCards(indexes) {
    const cardsElement = document.querySelector('#cards')
    cardsElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },
  //翻牌function
  flipCards(...cards) {
    cards.forEach(card => {
      if (card.classList.contains('back')) {
        //回傳牌面
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      //回傳牌背
      card.classList.add('back')
      card.innerHTML = null
    })
  },
  //點到相同牌組的時候，新增卡片class name資料
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
    console.log(cards)
  },
  //計分畫面
  renderScore(score) {
    document.querySelector('.score').innerText = `Score : ${score}`
  },
  //嘗試次數畫面
  renderTriedTimes(times) {
    document.querySelector('.tried').innerText = `You've tried : ${times} times.`
  },
  //加入動畫效果
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      //使用監聽器綁定動畫結束事件(animationend)
      card.addEventListener('animationend', e => {
        //{once: true}代表監聽器執行一次後就要移除監聽器
        event.target.classList.remove('wrong'), { once: true }
      })
    })
  },
  //遊戲結束畫面
  showGameFinished() {
    let completed = document.querySelector('.completed')
    completed.style.display = 'block'
    document.querySelector('.final-score').innerText = `Score : ${model.score}`
    document.querySelector('.final-times').innerText = `You've tried : ${model.times} times`
  }
}

//遊戲資料
const model = {
  revealedCards: [],//代表被翻開的牌
  //檢查revealedCards中的兩組牌是否一樣
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  score: 0,
  times: 0,
}

//宣告controller管理GAME_STATE
const controller = {
  //初始遊戲狀態為FirstCardAwaits
  currentState: GAME_STATE.FirstCardAwaits,
  //產生卡牌資料
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  //依據遊戲狀態來執行不同的動作
  dispatchCardAction(card) {
    //如果card中的class不含有back就中斷
    if (!card.classList.contains('back')) return
    //設定遊戲狀態對應的動作
    switch (this.currentState) {
      //遊戲開始，FirstCardAwaits
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      //已經翻開第一張牌，SecondCardAwaits
      case GAME_STATE.SecondCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        view.renderTriedTimes(++model.times)
        if (model.isRevealedCardsMatched()) {
          //當兩組相同時
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if (model.score === 260) {
            console.log('showGameFinished')
            view.showGameFinished()
            this.currentState = GAME_STATE.GameFinished
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          //當兩組不同時
          this.currentState = GAME_STATE.CardMatchedFailed
          //設定延遲時間
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('currentState:', this.currentState)
    console.log('revealedCards:', model.revealedCards.map(card => card.dataset.index))
  },
  //將卡牌翻回背面
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  },
  //重新開始遊戲
  restartGame() {
    controller.currentState = GAME_STATE.FirstCardAwaits
    let completed = document.querySelector('.completed')
    completed.style.display = 'none'
    model.times = 0
    model.score = 0
    controller.generateCards()
    controller.clickCards()
  },
  //選牌器
  clickCards() {
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', event => {
        controller.dispatchCardAction(card)
      })
    })
  }
}
//執行遊戲
controller.generateCards()
//選牌器
controller.clickCards()