'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  ListView,
  Keyboard,
  AsyncStorage,
  ActivityIndicator
} from 'react-native';
import Header from './Header'
import Footer from './Footer'
import Row from './Row'

const filterItems = (filter, items) => {
  return items.filter((item) => {
    if (filter === 'All') return true
    if (filter === 'Active') return !item.complete
    if (filter === 'Completed') return item.complete
  })
}

class App extends Component {
  constructor(props) {
    super(props);
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2 });
    this.state = {
      loading: true,
      value: '',
      items: [],
      allComplete: false,
      dataSource: ds.cloneWithRows([]),
      filter: 'All'
    };
    this.handleAddItem = this.handleAddItem.bind(this)
    this.handleToggleAllComplete = this.handleToggleAllComplete.bind(this)
    this.setSource = this.setSource.bind(this)
    this.handleToggleComplete = this.handleToggleComplete.bind(this)
    this.handleRemoveItem = this.handleRemoveItem.bind(this)
    this.handleFilter = this.handleFilter.bind(this)
    this.handleClearCompleated = this.handleClearCompleated.bind(this)
    this.handleUpdateText = this.handleUpdateText.bind(this)
    this.handleToggleEditing = this.handleToggleEditing.bind(this)
  }
  componentWillMount() {
    AsyncStorage.getItem('items')
      .then((json) => {
        try {
          const items = JSON.parse(json)
          this.setSource(items, items, {loading: false})
        } catch(e) {
          this.setState({
            loading: false,
          });
        }
      })
  }
  handleAddItem() {
    if (!this.state.value) return
    const newItems = [
      ...this.state.items,
      {
        key: Date.now(),
        text: this.state.value,
        complete: false
      }
    ]
    this.setSource(newItems, filterItems(this.state.filter, newItems) , {value: ''})
  }
  handleRemoveItem(key) {
    const newItems = this.state.items.filter((item) => {
      return item.key === key ? false : true
    })
    this.setSource(newItems, filterItems(this.state.filter,newItems))
  }
  handleToggleComplete(key, complete) {
    console.log(complete)
    const newItems = this.state.items.map((item) => {
      if (item.key === key) {
        return Object.assign({}, item, {complete: complete})
      } else {
        return item
      }
    })
    this.setSource(newItems, filterItems(this.state.filter,newItems))
  }
  handleToggleAllComplete() {
    const complete = !this.state.allComplete
    // const newItems = this.state.items.map((item) => {
    //   return {
    //     ...item,
    //     complete
    //   }
    // })
    const newItems = this.state.items.map((item) => {
      return Object.assign({}, item, {complete})
    })
    this.setSource(newItems, newItems, {allComplete: complete})
  }
  handleUpdateText(key, text) {
    const newItems = this.state.items.map((item) => {
      if (item.key !== key) return item
      return {
        ...item,
        text
      }
    })
    this.setSource(newItems, filterItems(this.state.filter, newItems))
  }
  handleToggleEditing(key, editing) {
    const newItems = this.state.items.map((item) => {
      if (item.key !== key) return item
      return {
        ...item,
        editing
      }
    })
    this.setSource(newItems, filterItems(this.state.filter, newItems))
  }
  handleFilter(filter) {
    this.setSource(this.state.items, filterItems(filter, this.state.items), {filter})
  }
  handleClearCompleated() {
    const newItems = this.state.items.filter((item) => {
      return !item.complete
    })
    this.setSource(newItems, filterItems(this.state.filter, newItems))
  }
  setSource(items, itemsDataSource, otherState = {}) {
    console.table(itemsDataSource)
    this.setState({
      items,
      dataSource: this.state.dataSource.cloneWithRows(itemsDataSource),
      ...otherState
    });
    AsyncStorage.setItem('items', JSON.stringify(items))
  }
  render() {
    return (
      <View style={styles.container}>
        <Header
          value={this.state.value}
          onAddItem={this.handleAddItem}
          onChange={(value) => this.setState({value})}
          onToggleAllComplete={this.handleToggleAllComplete}
        />
        <View style={styles.content}>
          <ListView
            enableEmptySections
            style={styles.list}
            dataSource={this.state.dataSource}
            onScroll={() => Keyboard.dismiss()}
            renderRow={({key, ...value}) => {
              return (
                <Row
                  key={key}
                  onRemove={() => this.handleRemoveItem(key)}
                  onComplete={(complete) => this.handleToggleComplete(key, complete)}
                  onToggleEdit={(editing) => this.handleToggleEditing(key, editing)}
                  onUpdate={(text) => this.handleUpdateText(key, text)}
                  {...value}
                />
              )
            }}
            renderSeparator={(sectionId, rowId) => {
              return <View key={rowId} style={styles.separator}/>
            }}
          />
        </View>
        <Footer
          onFilter={this.handleFilter}
          filter={this.state.filter}
          count={filterItems('Active', this.state.items).length}
          onClearCompleated={this.handleClearCompleated}
        />
        {this.state.loading && <View style={styles.loading}>
          <ActivityIndicator
            animating
            size='large'
          />
        </View>}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    ...Platform.select({
      ios: { paddingTop: 30}
    })
  },
  content: {
    flex: 1
  },
  list: {
    backgroundColor: '#FFF'
  },
  separator: {
    borderWidth: 1,
    borderColor: '#F5F5F5'
  },
  loading: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,.2)'
  }
});


export default App;
